/**
 * VRC Engine Constants
 *
 * Loads the authoritative spec file:
 *   rgp/Vossari Resonance Codex Engine Constants.json
 *
 * Provides the three immutable data sets that define the VRC calculation engine:
 *   - Planetary inputs (13 bodies) with Swiss Ephemeris IDs
 *   - 9 Centers with their type (Pressure / Motor / Awareness / etc.)
 *   - 36 named Channels connecting centers
 *
 * This is read-only at runtime. The JSON is never mutated.
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanetaryInput {
  id: string;
  name: string;
  swiss_eph_id: number | string; // Earth and South Node are "CALCULATED"
}

export interface VrcCenter {
  id: string;   // e.g. "HEAD", "SOLAR"
  name: string; // e.g. "Head Center"
  type: string; // e.g. "Pressure", "Motor/Awareness"
}

export interface VrcChannel {
  id: string;       // e.g. "64-47"
  name: string;     // e.g. "Abstraction"
  gate_a: number;
  gate_b: number;
  connects: string[]; // e.g. ["HEAD", "AJNA"]
}

interface EngineConstantsDoc {
  meta: { system: string; version: string; description: string };
  planetary_inputs: PlanetaryInput[];
  centers: VrcCenter[];
  channels: VrcChannel[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

let _constants: EngineConstantsDoc | null = null;

function load(): EngineConstantsDoc {
  if (_constants) return _constants;

  const jsonPath = join(
    dirname(fileURLToPath(import.meta.url)),
    'data/vrc-engine-constants.json',
  );

  try {
    // Strip markdown code fences (```json ... ```) that may wrap the file content
    let text = readFileSync(jsonPath, 'utf-8');
    text = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/, '');
    _constants = JSON.parse(text) as EngineConstantsDoc;
  } catch (err) {
    console.error('[VRC] Failed to load Engine Constants JSON:', err);
    _constants = {
      meta: { system: 'Vossari Resonance Codex', version: '1.0', description: '' },
      planetary_inputs: [],
      centers: [],
      channels: [],
    };
  }

  return _constants;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** All 13 planetary inputs with their Swiss Ephemeris IDs. */
export function getPlanetaryInputs(): PlanetaryInput[] {
  return load().planetary_inputs;
}

/** All 9 Centers with type annotations. */
export function getVrcCenters(): VrcCenter[] {
  return load().centers;
}

/** All 36 named Channels. */
export function getVrcChannels(): VrcChannel[] {
  return load().channels;
}

/**
 * Returns all channels that involve a given codon (gate number).
 * Used by CodonDetail to show which channel(s) this codon participates in.
 */
export function getChannelsForCodon(codonId: number): VrcChannel[] {
  return load().channels.filter(
    ch => ch.gate_a === codonId || ch.gate_b === codonId,
  );
}

/** Look up a center by its ID string (e.g. "HEAD"). */
export function getCenterById(centerId: string): VrcCenter | undefined {
  return load().centers.find(c => c.id === centerId);
}
