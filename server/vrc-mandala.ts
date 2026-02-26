/**
 * VRC Mandala Engine
 * Implements the Vossari Resonance Codex mapping grid per VRC Master Implementation Protocol v1.0
 *
 * Key parameters (§ 3 — The Mapping Grid):
 *   360° / 64 Codons  = 5.625° per Codon
 *   5.625° / 4 Facets = 1.40625° per Facet
 *   Facet names: Somatic | Relational | Cognitive | Transpersonal
 *
 * Wheel offset θ₀ = 11.25°  (verified by VRC Appendix B validation vector)
 *   T_birth = 2024-01-01 12:00:00 UTC, 0°N 0°E
 *   Conscious Sun ≈ 280.44° → slot 47 → Codon 38 (The Fighter)      ✓
 *   Design Sun   ≈ 192.44° → slot 32 → Codon 57 (Intuitive Clarity)  ✓
 *
 * Facet conversion formula (VRC § 3):
 *   localPos   = (longitude − startDegreeOfCodon)
 *   facetIndex = floor(localPos / 1.40625)
 */

/** Degrees of arc occupied by one Codon slot (360 / 64). */
export const CODON_ARC = 5.625;

/** Degrees of arc occupied by one Facet within a Codon (CODON_ARC / 4). */
export const FACET_ARC = 1.40625;

/**
 * Tropical longitude at which the Mandala wheel begins (slot 0 = Codon 51).
 * Derived analytically from the VRC validation vector — do not change.
 */
export const WHEEL_OFFSET = 11.25;

/** Facet names in order of facetIndex 0–3 (VRC § 3). */
export type FacetName = 'Somatic' | 'Relational' | 'Cognitive' | 'Transpersonal';

export const FACET_NAMES: readonly FacetName[] = [
  'Somatic',
  'Relational',
  'Cognitive',
  'Transpersonal',
];

/**
 * The 64 Codon numbers arranged in Mandala wheel order (VRC Appendix A).
 * Index 0 starts at WHEEL_OFFSET (11.25° tropical longitude).
 *
 * Q1 (11.25°–101.25°):  51,42, 3,27,24, 2,23, 8,20,16,35,45,12,15,52,39
 * Q2 (101.25°–191.25°): 53,62,56,31,33, 7, 4,29,59,40,64,47, 6,46,18,48
 * Q3 (191.25°–281.25°): 57,32,50,28,44, 1,43,14,34, 9, 5,26,11,10,58,38
 * Q4 (281.25°–011.25°): 54,61,60,41,19,13,49,30,55,37,63,22,36,25,17,21
 */
export const VRC_MANDALA: readonly number[] = [
  // Q1  (slots  0–15)
  51, 42,  3, 27, 24,  2, 23,  8, 20, 16, 35, 45, 12, 15, 52, 39,
  // Q2  (slots 16–31)
  53, 62, 56, 31, 33,  7,  4, 29, 59, 40, 64, 47,  6, 46, 18, 48,
  // Q3  (slots 32–47)
  57, 32, 50, 28, 44,  1, 43, 14, 34,  9,  5, 26, 11, 10, 58, 38,
  // Q4  (slots 48–63)
  54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21,
];

/** Names for all 64 Codons (I Ching / VRC). Index = codon number − 1. */
export const CODON_NAMES: Record<number, string> = {
   1: 'The Creative',
   2: 'The Receptive',
   3: 'Ordering',
   4: 'Formulization',
   5: 'Fixed Rhythms',
   6: 'Friction',
   7: 'The Role of the Self',
   8: 'Contribution',
   9: 'Focus',
  10: 'Behavior of the Self',
  11: 'Ideas',
  12: 'Caution',
  13: 'The Listener',
  14: 'Power Skills',
  15: 'Extremes',
  16: 'Skills',
  17: 'Opinions',
  18: 'Correction',
  19: 'Wanting',
  20: 'The Now',
  21: 'The Hunter',
  22: 'Openness',
  23: 'Assimilation',
  24: 'Rationalization',
  25: 'Innocence',
  26: 'The Trickster',
  27: 'Caring',
  28: 'The Game Player',
  29: 'Perseverance',
  30: 'Recognition of Feelings',
  31: 'Leadership',
  32: 'Continuity',
  33: 'Privacy',
  34: 'Power',
  35: 'Change',
  36: 'Crisis',
  37: 'Friendship',
  38: 'The Fighter',
  39: 'Provocation',
  40: 'Aloneness',
  41: 'Contraction',
  42: 'Growth',
  43: 'Insight',
  44: 'Alertness',
  45: 'The Gatherer',
  46: 'Determination',
  47: 'Realization',
  48: 'Depth',
  49: 'Principles',
  50: 'Values',
  51: 'Shock',
  52: 'Stillness',
  53: 'Beginnings',
  54: 'Ambition',
  55: 'Spirit',
  56: 'Stimulation',
  57: 'Intuitive Clarity',
  58: 'Joy',
  59: 'Sexuality',
  60: 'Acceptance',
  61: 'Mystery',
  62: 'Details',
  63: 'Doubt',
  64: 'Confusion',
};

/**
 * 9-Center names used in the VRC / ROS system.
 */
export type CenterName =
  | 'Head'
  | 'Ajna'
  | 'Throat'
  | 'G-Center'
  | 'Heart'
  | 'Solar Plexus'
  | 'Sacral'
  | 'Spleen'
  | 'Root';

/**
 * Maps each of the 64 Codon numbers to its Center.
 * Derived from the Human Design Bodygraph (which the VRC Bio-Circuitry mirrors).
 * NOTE: Verify against VRC Bio-Circuitry diagram image when available.
 */
export const CODON_CENTER_MAP: Record<number, CenterName> = {
  // Head (Pressure)
  64: 'Head', 61: 'Head', 63: 'Head',

  // Ajna (Awareness)
  47: 'Ajna', 24: 'Ajna', 4: 'Ajna', 17: 'Ajna', 43: 'Ajna', 11: 'Ajna',

  // Throat (Manifestation) — gates 1, 7, 13 belong to G-Center per VRC channel data
  62: 'Throat', 23: 'Throat', 56: 'Throat', 35: 'Throat', 12: 'Throat',
  45: 'Throat', 16: 'Throat', 31: 'Throat',  8: 'Throat', 33: 'Throat',
  20: 'Throat',

  // G-Center (Identity) — gates 1, 7, 13 confirmed from channels 8-1, 31-7, 33-13
  25: 'G-Center', 46: 'G-Center', 15: 'G-Center', 10: 'G-Center',
   2: 'G-Center',  1: 'G-Center',  7: 'G-Center', 13: 'G-Center',

  // Heart / Ego (Motor)
  21: 'Heart', 40: 'Heart', 26: 'Heart', 51: 'Heart',

  // Solar Plexus (Motor/Awareness)
  36: 'Solar Plexus', 22: 'Solar Plexus', 37: 'Solar Plexus',
  49: 'Solar Plexus', 55: 'Solar Plexus', 30: 'Solar Plexus', 6: 'Solar Plexus',

  // Sacral (Motor) — gate 27 confirmed from channel 50-27 (Spleen–Sacral)
  34: 'Sacral', 5: 'Sacral', 14: 'Sacral', 29: 'Sacral', 27: 'Sacral',
  59: 'Sacral', 9: 'Sacral', 3: 'Sacral', 42: 'Sacral',

  // Spleen (Awareness)
  48: 'Spleen', 57: 'Spleen', 44: 'Spleen', 50: 'Spleen',
  32: 'Spleen', 28: 'Spleen', 18: 'Spleen',

  // Root (Pressure/Motor)
  58: 'Root', 38: 'Root', 54: 'Root', 53: 'Root',
  60: 'Root', 52: 'Root', 19: 'Root', 39: 'Root', 41: 'Root',
};

/**
 * The 36 Bio-Circuitry channels — each channel is a pair [gateA, gateB].
 * A channel is ACTIVE when both gates are defined (one from each chart, or both from same).
 * NOTE: Verify against VRC Bio-Circuitry diagram image when available.
 */
export const VRC_CHANNELS: readonly [number, number][] = [
  // Head–Ajna
  [64, 47], [61, 24], [63,  4],
  // Ajna–Throat
  [17, 62], [43, 23], [11, 56],
  // Throat–G-Center
  [31,  7], [ 8,  1], [33, 13], [20, 10],
  // Throat–Heart
  [45, 21],
  // Throat–Solar Plexus
  [35, 36], [12, 22],
  // Throat–Spleen
  [16, 48], [20, 57],
  // Throat–Sacral
  [20, 34],
  // G-Center–Heart
  [25, 51],
  // G-Center–Spleen
  [10, 57],
  // G-Center–Sacral
  [ 2, 14], [15,  5], [46, 29], [10, 34],
  // Heart–Solar Plexus
  [40, 37],
  // Heart–Spleen
  [26, 44],
  // Spleen–Sacral
  [27, 50], [57, 34],
  // Spleen–Root
  [28, 38], [18, 58], [32, 54],
  // Sacral–Solar Plexus
  [59,  6],
  // Sacral–Root
  [ 9, 52], [ 3, 60], [42, 53],
  // Root–Solar Plexus
  [41, 30], [19, 49], [39, 55],
];

// ─── Core mapping functions ──────────────────────────────────────────────────

/**
 * Convert a tropical longitude (0–360°) to its VRC Codon number (1–64).
 */
export function longitudeToCodon(longitude: number): number {
  const normalized = ((longitude - WHEEL_OFFSET) % 360 + 360) % 360;
  const slotIndex = Math.floor(normalized / CODON_ARC);
  return VRC_MANDALA[Math.min(63, slotIndex)];
}

/**
 * Convert a tropical longitude (0–360°) to its Facet within the Codon.
 *
 * VRC § 3 formula:
 *   localPos   = normalized mod CODON_ARC
 *   facetIndex = floor(localPos / FACET_ARC)
 */
export function longitudeToFacet(longitude: number): FacetName {
  const normalized = ((longitude - WHEEL_OFFSET) % 360 + 360) % 360;
  const localPos = normalized % CODON_ARC;
  const facetIndex = Math.min(3, Math.floor(localPos / FACET_ARC));
  return FACET_NAMES[facetIndex];
}

/** Combined: returns Codon, Facet, and slot start degree for a longitude. */
export function longitudeToCodonFacet(longitude: number): {
  codon: number;
  codonName: string;
  facet: FacetName;
  slotStartDegree: number;
  center: CenterName;
} {
  const normalized = ((longitude - WHEEL_OFFSET) % 360 + 360) % 360;
  const slotIndex = Math.min(63, Math.floor(normalized / CODON_ARC));
  const localPos = normalized % CODON_ARC;
  const facetIndex = Math.min(3, Math.floor(localPos / FACET_ARC));
  const codon = VRC_MANDALA[slotIndex];
  return {
    codon,
    codonName: CODON_NAMES[codon] ?? `Codon ${codon}`,
    facet: FACET_NAMES[facetIndex],
    slotStartDegree: (slotIndex * CODON_ARC + WHEEL_OFFSET) % 360,
    center: CODON_CENTER_MAP[codon] ?? 'Root',
  };
}

/**
 * Earth longitude is always 180° opposite the Sun (VRC two-timing algorithm).
 */
export function earthLongitude(sunLongitude: number): number {
  return (sunLongitude + 180) % 360;
}

// ─── Bio-Circuitry evaluation ─────────────────────────────────────────────────

export interface ChannelStatus {
  gateA: number;
  gateB: number;
  active: boolean; // true = both gates are defined
  centerA: CenterName;
  centerB: CenterName;
}

/**
 * Evaluate which Bio-Circuitry channels are ACTIVE given a set of defined gate numbers.
 *
 * A channel is ACTIVE when both its gates are present in definedGates
 * (regardless of whether they come from the Conscious or Design chart).
 */
export function evaluateChannels(definedGates: Set<number>): ChannelStatus[] {
  return VRC_CHANNELS.map(([gateA, gateB]) => ({
    gateA,
    gateB,
    active: definedGates.has(gateA) && definedGates.has(gateB),
    centerA: CODON_CENTER_MAP[gateA] ?? 'Root',
    centerB: CODON_CENTER_MAP[gateB] ?? 'Root',
  }));
}

/**
 * Determine which Centers are DEFINED (at least one Active channel)
 * and which are OPEN (no Active channels).
 */
export function evaluateCenters(channels: ChannelStatus[]): Record<CenterName, 'defined' | 'open'> {
  const activeChannels = channels.filter(c => c.active);
  const activeCenterNames = new Set<CenterName>();
  for (const ch of activeChannels) {
    activeCenterNames.add(ch.centerA);
    activeCenterNames.add(ch.centerB);
  }

  const ALL_CENTERS: CenterName[] = [
    'Head', 'Ajna', 'Throat', 'G-Center', 'Heart', 'Solar Plexus', 'Sacral', 'Spleen', 'Root',
  ];
  const result = {} as Record<CenterName, 'defined' | 'open'>;
  for (const center of ALL_CENTERS) {
    result[center] = activeCenterNames.has(center) ? 'defined' : 'open';
  }
  return result;
}

// ─── Type & Authority determination ──────────────────────────────────────────

export type VrcType = 'Reflector' | 'Resonator' | 'Catalyst' | 'Harmonizer';
export type VrcAuthority =
  | 'Solar Plexus'
  | 'Sacral'
  | 'Spleen'
  | 'Ego/Heart'
  | 'G-Center'
  | 'None/Outer'
  | 'Environment';

/**
 * Determine VRC Type from defined centers (VRC § 7).
 *
 *   Reflector  = all 9 centers open
 *   Resonator  = Sacral defined
 *   Catalyst   = Throat defined + Sacral open
 *   Harmonizer = Sacral open + Throat open (and not all open)
 */
export function determineType(
  centers: Record<CenterName, 'defined' | 'open'>
): VrcType {
  const allOpen = Object.values(centers).every(s => s === 'open');
  if (allOpen) return 'Reflector';
  if (centers['Sacral'] === 'defined') return 'Resonator';
  if (centers['Throat'] === 'defined') return 'Catalyst';
  return 'Harmonizer';
}

/**
 * Determine VRC Authority using priority hierarchy (VRC § 7).
 *
 *   Priority: Solar Plexus > Sacral > Spleen > Ego/Heart > G-Center > None/Outer > Environment
 */
export function determineAuthority(
  centers: Record<CenterName, 'defined' | 'open'>
): VrcAuthority {
  if (centers['Solar Plexus'] === 'defined') return 'Solar Plexus';
  if (centers['Sacral'] === 'defined') return 'Sacral';
  if (centers['Spleen'] === 'defined') return 'Spleen';
  if (centers['Heart'] === 'defined') return 'Ego/Heart';
  if (centers['G-Center'] === 'defined') return 'G-Center';
  if (centers['Head'] === 'defined' || centers['Ajna'] === 'defined') return 'None/Outer';
  return 'Environment';
}
