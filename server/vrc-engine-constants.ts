/**
 * VRC Engine Constants
 *
 * Loads the authoritative spec from server/data/vrc-engine-constants.json
 * (bundled into the build by esbuild).
 *
 * Provides the three immutable data sets that define the VRC calculation engine:
 *   - Planetary inputs (13 bodies) with Swiss Ephemeris IDs
 *   - 9 Centers with their type (Pressure / Motor / Awareness / etc.)
 *   - 36 named Channels connecting centers
 *
 * This is read-only at runtime. The JSON is never mutated.
 */

import rawConstants from './data/vrc-engine-constants.json';

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

// ─── Public API ───────────────────────────────────────────────────────────────

const _doc = rawConstants as EngineConstantsDoc;

/** All 13 planetary inputs with their Swiss Ephemeris IDs. */
export function getPlanetaryInputs(): PlanetaryInput[] {
  return _doc.planetary_inputs;
}

/** All 9 Centers with type annotations. */
export function getVrcCenters(): VrcCenter[] {
  return _doc.centers;
}

/** All 36 named Channels. */
export function getVrcChannels(): VrcChannel[] {
  return _doc.channels;
}

/**
 * Returns all channels that involve a given codon (gate number).
 * Used by CodonDetail to show which channel(s) this codon participates in.
 */
export function getChannelsForCodon(codonId: number): VrcChannel[] {
  return _doc.channels.filter(
    ch => ch.gate_a === codonId || ch.gate_b === codonId,
  );
}

/** Look up a center by its ID string (e.g. "HEAD"). */
export function getCenterById(centerId: string): VrcCenter | undefined {
  return _doc.centers.find(c => c.id === centerId);
}
