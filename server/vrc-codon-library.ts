/**
 * VRC Codon Library
 *
 * Loads the full 64-codon × 4-facet dataset from the authoritative spec file
 * at rgp/Vossari Codons 64x256facets.json.
 *
 * This is the single source of truth for:
 *   - Vossari codon names (e.g. "AURORA", "THE RECEIVER")
 *   - Shadow / Gift / Siddhi descriptions per codon
 *   - Per-facet descriptions, shadow manifestations, micro-corrections, resonance keys
 *   - Chemical markers, archetype roles, somatic markers
 *
 * All data is read-only at runtime. The JSON is never mutated.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

type FacetLetter = 'A' | 'B' | 'C' | 'D';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CodonFacetData {
  title: string;
  degrees: string;
  description: string;
  shadow_manifestation: string;
  micro_correction: string;
  resonance_keys: string[];
}

export interface CodonFrequency {
  shadow: string;
  shadow_desc: string;
  gift: string;
  gift_desc: string;
  siddhi: string;
  siddhi_desc: string;
}

export interface CodonEntry {
  id: number;
  code: string;
  name: string;               // Vossari name (e.g. "AURORA")
  traditional_name: string;   // HD gate name (e.g. "The Creative")
  binary: string;
  chemical_marker: string;
  archetype_role: string;
  somatic_marker: string;
  frequency: CodonFrequency;
  facets: Record<FacetLetter, CodonFacetData>;
}

// ─── Loader ───────────────────────────────────────────────────────────────────

let _library: Map<number, CodonEntry> | null = null;

function loadLibrary(): Map<number, CodonEntry> {
  if (_library) return _library;

  // JSON lives at Vossari_Conduit-Hub/rgp/ — three levels above server/
  const jsonPath = join(dirname(fileURLToPath(import.meta.url)), '../../../rgp/Vossari Codons 64x256facets.json');

  try {
    // Strip markdown code fences (```json ... ```) that may wrap the file content
    let text = readFileSync(jsonPath, 'utf-8');
    text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/, '');
    const raw = JSON.parse(text) as CodonEntry[];
    _library = new Map(raw.map(entry => [entry.id, entry]));
  } catch (err) {
    console.error('[VRC] Failed to load codon library — micro-corrections and Vossari names will be unavailable.', err);
    _library = new Map();
  }

  return _library;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Full codon entry including all facet data. */
export function getCodonEntry(codonId: number): CodonEntry | undefined {
  return loadLibrary().get(codonId);
}

/**
 * Vossari-branded codon name (e.g. "AURORA").
 * Falls back to "Codon N" if the library is unavailable.
 */
export function getVossariName(codonId: number): string {
  return loadLibrary().get(codonId)?.name ?? `Codon ${codonId}`;
}

/** Traditional (I Ching / HD gate) name for the codon. */
export function getTraditionalName(codonId: number): string {
  return loadLibrary().get(codonId)?.traditional_name ?? `Codon ${codonId}`;
}

/** Full frequency data: shadow/gift/siddhi with descriptions. */
export function getFrequencyData(codonId: number): CodonFrequency | undefined {
  return loadLibrary().get(codonId)?.frequency;
}

/** Full data for a specific facet (A/B/C/D). */
export function getFacetData(codonId: number, facet: FacetLetter): CodonFacetData | undefined {
  return loadLibrary().get(codonId)?.facets[facet];
}

/**
 * Micro-correction text for a codon+facet combination.
 * This is the actual spec content, not an algorithmic placeholder.
 */
export function getMicroCorrection(codonId: number, facet: FacetLetter): string | undefined {
  return loadLibrary().get(codonId)?.facets[facet]?.micro_correction;
}
