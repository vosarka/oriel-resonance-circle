/**
 * RGP Prime Stack Calculation Engine — VRC v1.0
 *
 * Implements the Two-Timing Algorithm (VRC § 2) for the 9-position Prime Stack.
 *
 * Each position maps a specific planetary body from either the Conscious chart
 * (T_birth) or the Design chart (T_design) to its Codon + Facet via the
 * VRC Mandala (§ 3 / Appendix A).
 *
 * Prime Stack positions:
 *   1. Conscious Sun       — T_birth Sun              (weight 1.8)
 *   2. Conscious Earth     — T_birth Sun + 180°       (weight 1.3)
 *   3. Design Sun          — T_design Sun             (weight 1.2)
 *   4. Design Earth        — T_design Sun + 180°      (weight 1.1)
 *   5. Conscious Moon      — T_birth Moon             (weight 1.0)
 *   6. Design Moon         — T_design Moon            (weight 0.9)
 *   7. True Node           — T_birth North Node       (weight 0.7)
 *   8. Design True Node    — T_design North Node      (weight 0.6)
 *   9. Chiron              — T_birth Chiron           (weight 0.5)
 */

import {
  longitudeToCodonFacet,
  earthLongitude,
  evaluateChannels,
  evaluateCenters,
  determineType,
  determineAuthority,
  facetNameToLetter,
  type FacetLetter,
  type CenterName,
  type VrcType,
  type VrcAuthority,
  type ChannelStatus,
  CODON_NAMES,
} from './rgp-256-codon-engine';

import {
  calculateWeightedFrequency,
  PRIME_STACK_CONFIG,
} from './rgp-256-codon-engine';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PlanetaryPosition {
  body: string;
  longitude: number; // 0-360 degrees
  latitude?: number;
  speed?: number;
}

/** A single chart's planetary data (conscious or design). */
export interface ChartData {
  sun: PlanetaryPosition;
  moon: PlanetaryPosition;
  northNode: PlanetaryPosition;
  chiron: PlanetaryPosition;
  [key: string]: PlanetaryPosition;
}

/** One position in the Prime Stack with its resolved Codon and Facet. */
export interface PrimeStackCodon {
  position: number;         // 1–9
  name: string;             // e.g. "Conscious Sun"
  source: 'conscious' | 'design';
  planetaryBody: string;    // e.g. "Sun", "Earth"
  weight: number;
  longitude: number;        // raw degrees used for mapping
  codon: number;            // 1–64 (VRC gate number)
  codonName: string;
  facet: FacetLetter;       // A/B/C/D (legacy alias)
  facetFull: string;        // Somatic/Relational/Cognitive/Transpersonal
  codon256Id: string;       // e.g. "38-A"
  center: CenterName;
  baseFrequency: number;    // 0–100
  weightedFrequency: number;// 0–100 after weight
  // Keep legacy fields for UI backwards compatibility
  rootCodonId: string;      // e.g. "RC38" (legacy format)
  frequency: 'shadow' | 'gift' | 'crown' | 'siddhi'; // legacy facet label
}

export interface PrimeStackMap {
  positions: PrimeStackCodon[];
  totalWeight: number;
  dominantPosition: number;
  circuitLinks: CircuitLink[];
  // VRC Bio-Circuitry outputs
  channelStatuses: ChannelStatus[];
  centerStatuses: Record<CenterName, 'defined' | 'open'>;
  vrcType: VrcType;
  vrcAuthority: VrcAuthority;
}

export interface CircuitLink {
  position1: number;
  position2: number;
  linkType: 'harmonic' | 'opposition' | 'square' | 'trine';
  strength: number;
}

// ─── Legacy frequency label map ───────────────────────────────────────────────

const FACET_FREQUENCY_LABEL: Record<FacetLetter, 'shadow' | 'gift' | 'crown' | 'siddhi'> = {
  A: 'shadow',
  B: 'gift',
  C: 'crown',
  D: 'siddhi',
};

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Resolve one planetary longitude to a complete PrimeStackCodon entry.
 */
function resolvePosition(
  config: (typeof PRIME_STACK_CONFIG)[number],
  longitude: number,
  source: 'conscious' | 'design'
): PrimeStackCodon {
  const { codon, codonName, facet, center } = longitudeToCodonFacet(longitude);
  const facetLetter = facetNameToLetter(facet);

  // Base frequency: position of longitude within its codon's 5.625° arc, normalized to 0–100
  const normalized = ((longitude - 11.25) % 360 + 360) % 360;
  const localPos = normalized % 5.625;
  const baseFrequency = (localPos / 5.625) * 100;

  const weightedFrequency = Math.min(180, calculateWeightedFrequency(config.position, baseFrequency));

  return {
    position: config.position,
    name: config.name,
    source,
    planetaryBody: config.planetaryBody,
    weight: config.weight,
    longitude,
    codon,
    codonName,
    facet: facetLetter,
    facetFull: facet,
    codon256Id: `${codon}-${facetLetter}`,
    center,
    baseFrequency,
    weightedFrequency,
    // Legacy compatibility
    rootCodonId: `RC${String(codon).padStart(2, '0')}`,
    frequency: FACET_FREQUENCY_LABEL[facetLetter],
  };
}

/**
 * Convert raw planet record (keyed by planet name) to a PlanetaryPosition.
 */
function extractLongitude(
  planetsMap: Record<string, { longitude: number }>,
  key: string,
  fallback = 0
): number {
  return planetsMap[key]?.longitude ?? fallback;
}

/**
 * Calculate the complete Prime Stack from two birth charts (VRC Two-Timing Algorithm).
 *
 * @param consciousChart  Planetary positions at T_birth
 * @param designChart     Planetary positions at T_design (88° Solar Arc offset)
 */
export function calculatePrimeStack(
  consciousChart: Record<string, { longitude: number }>,
  designChart: Record<string, { longitude: number }>
): PrimeStackMap {
  // Extract key longitudes from both charts
  const cSun   = extractLongitude(consciousChart, 'Sun');
  const cMoon  = extractLongitude(consciousChart, 'Moon');
  const cNode  = extractLongitude(consciousChart, 'North Node');
  const cChiron= extractLongitude(consciousChart, 'Chiron');
  const cEarth = earthLongitude(cSun);

  const dSun   = extractLongitude(designChart, 'Sun');
  const dMoon  = extractLongitude(designChart, 'Moon');
  const dNode  = extractLongitude(designChart, 'North Node');
  const dEarth = earthLongitude(dSun);

  // Build each Prime Stack position
  const lonByPosition: Record<number, { lon: number; source: 'conscious' | 'design' }> = {
    1: { lon: cSun,   source: 'conscious' },
    2: { lon: cEarth, source: 'conscious' },
    3: { lon: dSun,   source: 'design' },
    4: { lon: dEarth, source: 'design' },
    5: { lon: cMoon,  source: 'conscious' },
    6: { lon: dMoon,  source: 'design' },
    7: { lon: cNode,  source: 'conscious' },
    8: { lon: dNode,  source: 'design' },
    9: { lon: cChiron,source: 'conscious' },
  };

  const positions: PrimeStackCodon[] = [];
  let totalWeight = 0;
  let dominantPosition = 1;
  let maxWeightedFrequency = 0;

  for (const config of PRIME_STACK_CONFIG) {
    const { lon, source } = lonByPosition[config.position] ?? { lon: 0, source: 'conscious' as const };
    const entry = resolvePosition(config, lon, source);
    positions.push(entry);
    totalWeight += config.weight;

    if (entry.weightedFrequency > maxWeightedFrequency) {
      maxWeightedFrequency = entry.weightedFrequency;
      dominantPosition = config.position;
    }
  }

  // ─── Bio-Circuitry evaluation ───────────────────────────────────────────────
  // All activated codons (from both charts) go into the defined-gate set
  const definedGates = new Set<number>(positions.map(p => p.codon));

  const channelStatuses = evaluateChannels(definedGates);
  const centerStatuses  = evaluateCenters(channelStatuses);
  const vrcType         = determineType(centerStatuses);
  const vrcAuthority    = determineAuthority(centerStatuses);

  // Legacy circuit links (kept for backwards-compatible API responses)
  const circuitLinks = buildLegacyCircuitLinks(positions);

  return {
    positions,
    totalWeight,
    dominantPosition,
    circuitLinks,
    channelStatuses,
    centerStatuses,
    vrcType,
    vrcAuthority,
  };
}

// ─── Legacy circuit link builder (backwards-compatible) ───────────────────────

function buildLegacyCircuitLinks(positions: PrimeStackCodon[]): CircuitLink[] {
  const links: CircuitLink[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = Math.abs(positions[i].baseFrequency - positions[j].baseFrequency);
      let linkType: CircuitLink['linkType'] = 'harmonic';
      let strength = 0;
      if (dist < 10) {
        linkType = 'harmonic';
        strength = 100 - dist * 5;
      } else if (dist > 45) {
        linkType = 'opposition';
        strength = 100 - Math.abs(dist - 50) * 2;
      } else if (dist > 40) {
        linkType = 'trine';
        strength = 100 - Math.abs(dist - 45) * 2;
      } else if (dist > 30) {
        linkType = 'square';
        strength = 100 - Math.abs(dist - 35) * 2;
      }
      if (strength > 30) {
        links.push({
          position1: positions[i].position,
          position2: positions[j].position,
          linkType,
          strength: Math.max(0, strength),
        });
      }
    }
  }
  return links;
}

// ─── 9-Center Resonance Map ───────────────────────────────────────────────────

/**
 * Build the 9-Center Resonance Map from the Prime Stack.
 * If multiple positions fall in the same center, the one with the highest
 * weighted frequency is reported.
 */
export function calculate9CenterMap(
  primeStack: PrimeStackMap
): Record<string, { centerName: CenterName; codon256Id: string; frequency: number; defined: boolean }> {
  const result: Record<string, { centerName: CenterName; codon256Id: string; frequency: number; defined: boolean }> = {};

  // Initialise all 9 centers
  const allCenters: CenterName[] = [
    'Head', 'Ajna', 'Throat', 'G-Center', 'Heart', 'Solar Plexus', 'Sacral', 'Spleen', 'Root',
  ];
  for (const c of allCenters) {
    result[c] = {
      centerName: c,
      codon256Id: '',
      frequency: 0,
      defined: primeStack.centerStatuses[c] === 'defined',
    };
  }

  // Fill with best (highest frequency) position per center
  for (const pos of primeStack.positions) {
    const center = pos.center;
    if (pos.weightedFrequency > (result[center]?.frequency ?? 0)) {
      result[center] = {
        centerName: center,
        codon256Id: pos.codon256Id,
        frequency: pos.weightedFrequency,
        defined: primeStack.centerStatuses[center] === 'defined',
      };
    }
  }

  return result;
}

// ─── Fractal Role ─────────────────────────────────────────────────────────────

export function calculateFractalRole(
  primeStack: PrimeStackMap
): { role: string; description: string; alignment: number } {
  const type = primeStack.vrcType;
  const descriptions: Record<typeof type, string> = {
    Reflector:  'Samples and reflects the state of the collective field',
    Resonator:  "Generates sustainable response to life's invitations",
    Catalyst:   'Initiates and sparks action in the world',
    Harmonizer: 'Guides and directs others through recognition',
  };

  const facetCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const p of primeStack.positions) facetCounts[p.facet]++;
  const totalPositions = primeStack.positions.length || 1;
  const dominantFacet = (Object.entries(facetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'A') as FacetLetter;
  const alignment = (facetCounts[dominantFacet] / totalPositions) * 100;

  return { role: type, description: descriptions[type], alignment };
}

// ─── Authority Node ────────────────────────────────────────────────────────────

export function calculateAuthorityNode(
  primeStack: PrimeStackMap
): { node: string; position: number; strength: number } {
  const authority = primeStack.vrcAuthority;
  const dominant = primeStack.positions.find(p => p.position === primeStack.dominantPosition);
  return {
    node: authority,
    position: dominant?.position ?? 1,
    strength: dominant?.weightedFrequency ?? 0,
  };
}

// ─── Validation ────────────────────────────────────────────────────────────────

export function validatePrimeStack(primeStack: PrimeStackMap): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (primeStack.positions.length !== 9) {
    errors.push(`Prime Stack should have 9 positions, found ${primeStack.positions.length}`);
  }
  for (const p of primeStack.positions) {
    if (!p.codon256Id.includes('-')) {
      errors.push(`Position ${p.position} has invalid codon256Id: ${p.codon256Id}`);
    }
    if (p.codon < 1 || p.codon > 64) {
      errors.push(`Position ${p.position} has out-of-range codon: ${p.codon}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function generatePrimeStackSummary(primeStack: PrimeStackMap): string {
  let summary = 'Prime Stack Analysis:\n\n';
  for (const p of primeStack.positions) {
    summary += `${p.position}. ${p.name} [${p.source}]\n`;
    summary += `   Codon ${p.codon} (${p.codonName}) — Facet ${p.facet} (${p.facetFull})\n`;
    summary += `   Center: ${p.center} | Freq: ${p.weightedFrequency.toFixed(1)} | Weight: ${p.weight}×\n\n`;
  }
  summary += `VRC Type: ${primeStack.vrcType}\n`;
  summary += `Authority: ${primeStack.vrcAuthority}\n`;
  return summary;
}
