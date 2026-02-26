/**
 * RGP 256-Codon Resolution Engine
 *
 * Re-implemented per VRC Master Implementation Protocol v1.0.
 *
 * Key changes from previous version:
 *   - Codon IDs now use actual VRC gate numbers (1–64) from the Mandala Sequence
 *   - Facet determination uses per-codon 1.40625° arcs (not 90° quadrants)
 *   - Facet names: Somatic | Relational | Cognitive | Transpersonal (VRC § 3)
 *   - All mapping delegated to vrc-mandala.ts (single source of truth)
 *
 * Legacy facet letter mapping for backwards compatibility with existing UI/DB:
 *   Somatic      → A
 *   Relational   → B
 *   Cognitive    → C
 *   Transpersonal → D
 */

export {
  type FacetName,
  CODON_ARC,
  FACET_ARC,
  WHEEL_OFFSET,
  VRC_MANDALA,
  CODON_NAMES,
  CODON_CENTER_MAP,
  VRC_CHANNELS,
  longitudeToCodon,
  longitudeToFacet,
  longitudeToCodonFacet,
  earthLongitude,
  evaluateChannels,
  evaluateCenters,
  determineType,
  determineAuthority,
  type CenterName,
  type VrcType,
  type VrcAuthority,
  type ChannelStatus,
} from './vrc-mandala';

import {
  longitudeToFacet,
  VRC_MANDALA,
  type FacetName,
} from './vrc-mandala';

// ─── Legacy type aliases (keep UI/tests compiling without changes) ─────────────

/** @deprecated Use FacetName from vrc-mandala.ts */
export type FacetLetter = 'A' | 'B' | 'C' | 'D';

/** Map VRC facet name → legacy letter used by existing UI code. */
export function facetNameToLetter(name: FacetName): FacetLetter {
  const map: Record<FacetName, FacetLetter> = {
    Somatic: 'A',
    Relational: 'B',
    Cognitive: 'C',
    Transpersonal: 'D',
  };
  return map[name];
}

/** Map legacy letter → VRC facet name. */
export function facetLetterToName(letter: FacetLetter): FacetName {
  const map: Record<FacetLetter, FacetName> = {
    A: 'Somatic',
    B: 'Relational',
    C: 'Cognitive',
    D: 'Transpersonal',
  };
  return map[letter];
}

// ─── Legacy compatibility shims ────────────────────────────────────────────────

/**
 * @deprecated Use longitudeToFacet() from vrc-mandala.ts and then facetNameToLetter().
 * Kept for backwards compatibility with test suites that call determineFacetFromLongitude.
 */
export function determineFacetFromLongitude(longitude: number): FacetLetter {
  return facetNameToLetter(longitudeToFacet(longitude));
}

/**
 * Generate a 256-codon identifier.
 * Accepts either a numeric codon (VRC format: "38-A") or a legacy RC string ("RC38-A").
 */
export function generateCodon256Id(codonRef: number | string, facet: FacetLetter): string {
  return `${codonRef}-${facet}`;
}

/**
 * Parse a 256-codon identifier back to components.
 * Supports both VRC format ("38-A") and legacy RC format ("RC38-A").
 */
export function parseCodon256Id(codon256Id: string): {
  codonNumber: number;
  rootCodonId: string; // legacy alias
  facet: FacetLetter;
} {
  const parts = codon256Id.split('-');
  const rawId = parts[0];
  const numericPart = rawId.replace(/^RC/, '');
  const codonNumber = parseInt(numericPart, 10);
  return {
    codonNumber,
    rootCodonId: rawId, // return as-is so round-trips work for legacy callers
    facet: parts[1] as FacetLetter,
  };
}

// ─── Coherence & SLI ──────────────────────────────────────────────────────────

export interface CodonFrequency {
  shadow: number;      // 0-100
  gift: number;        // 0-100
  crown: number;       // 0-100
  siddhi: number;      // 0-100
}

export interface FacetLoudness {
  A: number;           // Somatic amplitude
  B: number;           // Relational amplitude
  C: number;           // Cognitive amplitude
  D: number;           // Transpersonal amplitude
  dominant: FacetLetter;
}

/**
 * Calculate state amplifier from coherence score (0–100 → 0–1).
 */
export function calculateStateAmplifier(coherenceScore: number): number {
  return Math.max(0, Math.min(1, coherenceScore / 100));
}

/**
 * Calculate SLI (Shadow Loudness Index).
 *
 * Formula: SLI = PCS_frequency × stateAmplifier × facetAmplitude
 */
export function calculateSLI(
  consciousSunFrequency: number,
  stateAmplifier: number,
  facetAmplitude: number
): number {
  return Math.min(100, Math.max(0, consciousSunFrequency * stateAmplifier * facetAmplitude));
}

/**
 * Determine facet loudness from Carrierlock state inputs.
 *
 * Maps Mental Noise / Body Tension / Emotional Turbulence to A/B/C/D amplitudes.
 */
export function determineFacetLoudness(
  mentalNoise: number,
  bodyTension: number,
  emotionalTurbulence: number
): FacetLoudness {
  const mn = mentalNoise / 10;
  const bt = bodyTension / 10;
  const et = emotionalTurbulence / 10;

  const A = Math.max(0, 1 - mn) * 100;
  const B = Math.max(0, 1 - bt) * 100;
  const C = Math.max(0, 1 - et) * 100;
  const D = Math.max(0, 1 - (mn + bt + et) / 3) * 100;

  const pairs: [FacetLetter, number][] = [['A', A], ['B', B], ['C', C], ['D', D]];
  const dominant = pairs.reduce((p, c) => (c[1] > p[1] ? c : p))[0];

  return { A, B, C, D, dominant };
}

/**
 * Validate that the VRC Mandala has the correct number of entries.
 */
export function validate256CodonResolution(): { valid: boolean; errors: string[] } {
  const mandala = VRC_MANDALA;
  const errors: string[] = [];

  if (mandala.length !== 64) {
    errors.push(`Mandala should have 64 entries, found ${mandala.length}`);
  }

  const unique = new Set<number>(mandala);
  if (unique.size !== 64) {
    errors.push(`Mandala has duplicate entries — expected 64 unique codon numbers`);
  }

  if (PRIME_STACK_CONFIG.length !== 9) {
    errors.push(`Prime Stack should have 9 positions, found ${PRIME_STACK_CONFIG.length}`);
  }

  return { valid: errors.length === 0, errors };
}

// ─── Legacy shims (keep old test suites compiling) ────────────────────────────

/**
 * @deprecated Use facetLetterToName() instead.
 */
export function getFacetFrequency(facet: FacetLetter): 'shadow' | 'gift' | 'crown' | 'siddhi' {
  const map: Record<FacetLetter, 'shadow' | 'gift' | 'crown' | 'siddhi'> = {
    A: 'shadow', B: 'gift', C: 'crown', D: 'siddhi',
  };
  return map[facet];
}

/**
 * @deprecated
 */
export function calculatePrimaryInterference(
  facetLoudness: FacetLoudness
): Array<{ facet: FacetLetter; amplitude: number }> {
  return (
    [
      { facet: 'A' as FacetLetter, amplitude: facetLoudness.A },
      { facet: 'B' as FacetLetter, amplitude: facetLoudness.B },
      { facet: 'C' as FacetLetter, amplitude: facetLoudness.C },
      { facet: 'D' as FacetLetter, amplitude: facetLoudness.D },
    ] as Array<{ facet: FacetLetter; amplitude: number }>
  ).sort((a, b) => b.amplitude - a.amplitude);
}

// Re-export PrimeStackPosition type for downstream consumers
export interface PrimeStackPosition {
  position: number;
  name: string;
  planetaryBody: string;
  weight: number;
  codonId?: string;
  facet?: FacetLetter;
}

export function calculateWeightedFrequency(position: number, baseFrequency: number): number {
  const weights: Record<number, number> = {
    1: 1.8, 2: 1.3, 3: 1.2, 4: 1.1,
    5: 1.0, 6: 0.9, 7: 0.7, 8: 0.6, 9: 0.5,
  };
  return baseFrequency * (weights[position] ?? 1.0);
}

export const PRIME_STACK_CONFIG: PrimeStackPosition[] = [
  { position: 1, name: 'Conscious Sun',       planetaryBody: 'Sun',       weight: 1.8 },
  { position: 2, name: 'Conscious Earth',     planetaryBody: 'Earth',     weight: 1.3 },
  { position: 3, name: 'Design Sun',          planetaryBody: 'Sun',       weight: 1.2 },
  { position: 4, name: 'Design Earth',        planetaryBody: 'Earth',     weight: 1.1 },
  { position: 5, name: 'Conscious Moon',      planetaryBody: 'Moon',      weight: 1.0 },
  { position: 6, name: 'Design Moon',         planetaryBody: 'Moon',      weight: 0.9 },
  { position: 7, name: 'True Node',           planetaryBody: 'North Node',weight: 0.7 },
  { position: 8, name: 'Design True Node',    planetaryBody: 'North Node',weight: 0.6 },
  { position: 9, name: 'Chiron',              planetaryBody: 'Chiron',    weight: 0.5 },
];
