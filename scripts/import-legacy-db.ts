#!/usr/bin/env node
/**
 * Legacy DB Import Script
 *
 * Imports data from the old website's CSV exports into the new TiDB Cloud database.
 * Preserves original IDs so all cross-table references remain intact.
 *
 * Run from project root:
 *   pnpm exec tsx scripts/import-legacy-db.ts
 *
 * WARNING: This CLEARS the following tables before importing:
 *   users, chatMessages, orielMemories, orielUserProfiles, orielOversoulPatterns
 *   (plus carrierlockStates, codonReadings, bookmarks which depend on users)
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_FILES_DIR = path.resolve(
  __dirname,
  '../../../../Vossari_Conduit-Hub/db-files'
);

// ─── CSV Parser ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let inQuotes = false;
  let current = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

async function readCSV(filePath: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = [];
  const rl = readline.createInterface({ input: fs.createReadStream(filePath) });
  let headers: string[] = [];
  let isFirst = true;

  for await (const line of rl) {
    if (!line.trim()) continue;
    const values = parseCSVLine(line);
    if (isFirst) {
      headers = values;
      isFirst = false;
    } else {
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Read a CSV file that may contain multi-line quoted fields (e.g. ORIEL responses).
 * Reads the entire file into memory and does a single-pass parse.
 */
async function readCSVFull(filePath: string): Promise<Record<string, string>[]> {
  const text = await fs.promises.readFile(filePath, 'utf-8');
  const rows: Record<string, string>[] = [];
  let headers: string[] = [];
  let pos = 0;
  let isFirst = true;

  while (pos < text.length) {
    const { row, nextPos } = parseCSVRecord(text, pos);
    pos = nextPos;
    if (row.length === 0 || (row.length === 1 && row[0] === '')) continue;

    if (isFirst) {
      headers = row;
      isFirst = false;
    } else {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => { record[h] = row[i] ?? ''; });
      rows.push(record);
    }
  }

  return rows;
}

function parseCSVRecord(text: string, start: number): { row: string[]; nextPos: number } {
  const fields: string[] = [];
  let pos = start;

  while (pos <= text.length) {
    if (pos === text.length || text[pos] === '\n' || (text[pos] === '\r' && text[pos + 1] === '\n')) {
      // Empty field at end of line
      fields.push('');
      pos += (text[pos] === '\r') ? 2 : (pos < text.length ? 1 : 0);
      break;
    }

    if (text[pos] === '"') {
      // Quoted field
      let field = '';
      pos++; // skip opening quote
      while (pos < text.length) {
        if (text[pos] === '"') {
          if (text[pos + 1] === '"') {
            field += '"';
            pos += 2;
          } else {
            pos++; // skip closing quote
            break;
          }
        } else {
          field += text[pos];
          pos++;
        }
      }
      fields.push(field);
      // skip comma or newline after field
      if (text[pos] === ',') {
        pos++;
      } else if (text[pos] === '\r' && text[pos + 1] === '\n') {
        pos += 2;
        break;
      } else if (text[pos] === '\n' || pos === text.length) {
        pos++;
        break;
      }
    } else {
      // Unquoted field
      let field = '';
      while (pos < text.length && text[pos] !== ',' && text[pos] !== '\n' && text[pos] !== '\r') {
        field += text[pos];
        pos++;
      }
      fields.push(field);
      if (text[pos] === ',') {
        pos++;
      } else if (text[pos] === '\r' && text[pos + 1] === '\n') {
        pos += 2;
        break;
      } else if (text[pos] === '\n' || pos === text.length) {
        if (pos < text.length) pos++;
        break;
      }
    }
  }

  return { row: fields, nextPos: pos };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nv(val: string): string | null {
  return val === '' || val === 'null' || val === 'NULL' ? null : val;
}

function ni(val: string, fallback = 0): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

// ─── Connection ───────────────────────────────────────────────────────────────

function buildConnection() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL is not set');

  // Strip SSL query param for URL parsing
  const stripped = raw.replace(/\?ssl=.*$/, '');
  const u = new URL(stripped);

  return mysql.createConnection({
    host: u.hostname,
    port: parseInt(u.port || '4000'),
    user: u.username,
    password: decodeURIComponent(u.password),
    database: u.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
    multipleStatements: false,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Oriel Legacy DB Import ===\n');
  console.log(`DB files directory: ${DB_FILES_DIR}\n`);

  if (!fs.existsSync(DB_FILES_DIR)) {
    throw new Error(`DB files directory not found: ${DB_FILES_DIR}`);
  }

  const conn = await buildConnection();
  console.log('Connected to database.\n');

  try {
    // ── Clear dependent tables first ──────────────────────────────────────────
    console.log('Clearing existing data (dependency order)...');
    for (const table of [
      'codonReadings',
      'carrierlockStates',
      'bookmarks',
      'orielMemories',
      'orielUserProfiles',
      'orielOversoulPatterns',
      'chatMessages',
      'users',
    ]) {
      await conn.execute(`DELETE FROM \`${table}\``);
      process.stdout.write(`  Cleared ${table}\n`);
    }
    console.log();

    // ── 1. Users ─────────────────────────────────────────────────────────────
    console.log('Importing users...');
    const usersFile = path.join(DB_FILES_DIR, 'users_20260228_133000.csv');
    const usersRows = await readCSV(usersFile);

    for (const r of usersRows) {
      await conn.execute(
        `INSERT INTO users
           (id, openId, name, email, loginMethod, role,
            createdAt, updatedAt, lastSignedIn,
            conduitId, subscriptionStatus,
            paypalSubscriptionId, subscriptionStartDate, subscriptionRenewalDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ni(r.id),
          r.openId,
          nv(r.name),
          nv(r.email),
          nv(r.loginMethod),
          r.role || 'user',
          r.createdAt,
          r.updatedAt,
          r.lastSignedIn,
          nv(r.conduitId),
          r.subscriptionStatus || 'free',
          nv(r.paypalSubscriptionId),
          nv(r.subscriptionStartDate),
          nv(r.subscriptionRenewalDate),
        ]
      );
    }
    console.log(`  Imported ${usersRows.length} users.\n`);

    // ── 2. chatMessages (large — read all, batch insert) ─────────────────────
    // Note: content fields may contain newlines (ORIEL multi-line responses).
    // We read the whole file and do a quote-aware full parse.
    console.log('Importing chatMessages (reading full file)...');
    const chatFile = path.join(DB_FILES_DIR, 'chatMessages_20260228_132902.csv');
    const chatRows = await readCSVFull(chatFile);

    let chatCount = 0;
    const BATCH = 200;
    let batch: any[][] = [];

    const flushBatch = async () => {
      if (batch.length === 0) return;
      const placeholders = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
      await conn.execute(
        `INSERT INTO chatMessages (id, userId, role, content, timestamp) VALUES ${placeholders}`,
        batch.flat()
      );
      chatCount += batch.length;
      process.stdout.write(`\r  ${chatCount}/${chatRows.length} messages...`);
      batch = [];
    };

    for (const r of chatRows) {
      const ts = nv(r.timestamp) ?? new Date().toISOString().replace('T', ' ').substring(0, 19);
      batch.push([ni(r.id), ni(r.userId), r.role, r.content, ts]);
      if (batch.length >= BATCH) await flushBatch();
    }
    await flushBatch();
    console.log(`\n  Imported ${chatCount} chat messages.\n`);

    // ── 3. orielMemories ──────────────────────────────────────────────────────
    console.log('Importing orielMemories...');
    const memFile = path.join(DB_FILES_DIR, 'orielMemories_20260228_133017.csv');
    const memRows = await readCSV(memFile);

    for (const r of memRows) {
      await conn.execute(
        `INSERT INTO orielMemories
           (id, userId, category, content, importance, accessCount,
            lastAccessed, source, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ni(r.id),
          ni(r.userId),
          r.category,
          r.content,
          ni(r.importance, 5),
          ni(r.accessCount, 0),
          r.lastAccessed,
          r.source || 'conversation',
          r.isActive === '1' ? 1 : 0,
          r.createdAt,
          r.updatedAt,
        ]
      );
    }
    console.log(`  Imported ${memRows.length} memories.\n`);

    // ── 4. orielUserProfiles ─────────────────────────────────────────────────
    console.log('Importing orielUserProfiles...');
    const profileFile = path.join(DB_FILES_DIR, 'orielUserProfiles_20260228_133049.csv');
    const profileRows = await readCSV(profileFile);

    for (const r of profileRows) {
      await conn.execute(
        `INSERT INTO orielUserProfiles
           (id, userId, knownName, summary, interests,
            communicationStyle, journeyState,
            interactionCount, lastInteraction, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ni(r.id),
          ni(r.userId),
          nv(r.knownName),
          nv(r.summary),
          nv(r.interests),
          nv(r.communicationStyle),
          nv(r.journeyState),
          ni(r.interactionCount, 0),
          r.lastInteraction,
          r.createdAt,
          r.updatedAt,
        ]
      );
    }
    console.log(`  Imported ${profileRows.length} user profiles.\n`);

    // ── 5. orielOversoulPatterns ─────────────────────────────────────────────
    console.log('Importing orielOversoulPatterns...');
    const patternFile = path.join(DB_FILES_DIR, 'orielOversoulPatterns_20260228_133025.csv');
    const patternRows = await readCSV(patternFile);

    for (const r of patternRows) {
      await conn.execute(
        `INSERT INTO orielOversoulPatterns
           (id, category, pattern, application, impact,
            interactionCount, lastRefined, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ni(r.id),
          r.category,
          r.pattern,
          r.application,
          r.impact,
          ni(r.interactionCount, 1),
          r.lastRefined,
          r.createdAt,
          r.updatedAt,
        ]
      );
    }
    console.log(`  Imported ${patternRows.length} oversoul patterns.\n`);

    console.log('=== Import complete! ===');
    console.log('Note: signals, artifacts, transmissions, oracles, bookmarks');
    console.log('      were not in the export and remain as-is.\n');

  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('\nImport failed:', err.message || err);
  process.exit(1);
});
