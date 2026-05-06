/**
 * RGP 256-Codon Resolution Engine Tests — VRC v1.0
 *
 * Facet determination tests now verify VRC-correct behavior:
 *   - Each Codon occupies 5.625° of the Mandala wheel
 *   - Each Codon has 4 Facets of 1.40625° each
 *   - Wheel offset θ₀ = 11.25°
 *   - Facet A = Somatic (first 1.40625° within codon)
 *   - Facet B = Relational, C = Cognitive, D = Transpersonal
 */
import { describe, it, expect } from 'vitest';
import {
  CODON_CENTER_MAP,
  VRC_CHANNELS,
  determineAuthority,
  determineFacetFromLongitude,
  determineType,
  longitudeToCodonFacet,
  getFacetFrequency,
  calculateWeightedFrequency,
  calculateSLI,
  determineFacetLoudness,
  generateCodon256Id,
  parseCodon256Id,
  calculateStateAmplifier,
  calculatePrimaryInterference,
  validate256CodonResolution,
  PRIME_STACK_CONFIG,
  type CenterName,
} from './rgp-256-codon-engine';

const EXPECTED_CODON_CENTERS: Record<number, string> = {
  1: 'G-Self',
  2: 'G-Self',
  3: 'Sacral',
  4: 'Ajna',
  5: 'Sacral',
  6: 'Solar Plexus',
  7: 'G-Self',
  8: 'Throat',
  9: 'Sacral',
  10: 'G-Self',
  11: 'Ajna',
  12: 'Throat',
  13: 'G-Self',
  14: 'Sacral',
  15: 'G-Self',
  16: 'Throat',
  17: 'Ajna',
  18: 'Spleen',
  19: 'Root',
  20: 'Throat',
  21: 'Heart',
  22: 'Solar Plexus',
  23: 'Throat',
  24: 'Ajna',
  25: 'G-Self',
  26: 'Heart',
  27: 'Sacral',
  28: 'Spleen',
  29: 'Sacral',
  30: 'Solar Plexus',
  31: 'Throat',
  32: 'Spleen',
  33: 'Throat',
  34: 'Sacral',
  35: 'Throat',
  36: 'Solar Plexus',
  37: 'Solar Plexus',
  38: 'Root',
  39: 'Root',
  40: 'Heart',
  41: 'Root',
  42: 'Sacral',
  43: 'Ajna',
  44: 'Spleen',
  45: 'Throat',
  46: 'G-Self',
  47: 'Ajna',
  48: 'Spleen',
  49: 'Solar Plexus',
  50: 'Sacral',
  51: 'Heart',
  52: 'Root',
  53: 'Root',
  54: 'Root',
  55: 'Solar Plexus',
  56: 'Throat',
  57: 'Spleen',
  58: 'Root',
  59: 'Sacral',
  60: 'Root',
  61: 'Crown',
  62: 'Throat',
  63: 'Crown',
  64: 'Crown',
};

const EXPECTED_CHANNELS: Array<[number, number]> = [
  [64, 47], [61, 24], [63, 4],
  [17, 62], [43, 23], [11, 56],
  [31, 7], [8, 1], [33, 13], [20, 10],
  [45, 21],
  [35, 36], [12, 22],
  [16, 48], [20, 57],
  [20, 34],
  [25, 51],
  [2, 14], [15, 5], [46, 29], [10, 34],
  [50, 27],
  [10, 57],
  [40, 37],
  [26, 44],
  [30, 41], [49, 19], [55, 39],
  [6, 59],
  [34, 57],
  [9, 52], [3, 60], [42, 53],
  [38, 28], [54, 32], [58, 18],
];

const CENTER_NAMES: CenterName[] = [
  'Crown',
  'Ajna',
  'Throat',
  'G-Self',
  'Heart',
  'Solar Plexus',
  'Sacral',
  'Spleen',
  'Root',
];

function centersWith(
  definedCenters: CenterName[] = []
): Record<CenterName, 'defined' | 'open'> {
  const defined = new Set(definedCenters);
  return Object.fromEntries(
    CENTER_NAMES.map((center) => [
      center,
      defined.has(center) ? 'defined' : 'open',
    ])
  ) as Record<CenterName, 'defined' | 'open'>;
}

describe('RGP 256-Codon Resolution Engine', () => {
  describe('Facet Determination (VRC § 3 — per-codon 1.40625° arcs)', () => {
    // θ₀ = 11.25°; first codon (Codon 51) spans 11.25°–16.875°
    it('should determine Facet A (Somatic) at codon start', () => {
      // 11.25° = exact start of Codon 51 → localPos = 0 → facetIndex 0 = A
      expect(determineFacetFromLongitude(11.25)).toBe('A');
      // 11.25 + 1.0 = 12.25° still within Somatic arc (< 1.40625°)
      expect(determineFacetFromLongitude(12.25)).toBe('A');
    });

    it('should determine Facet B (Relational) at second facet boundary', () => {
      // Start of Relational: 11.25 + 1.40625 = 12.65625°
      expect(determineFacetFromLongitude(12.65625)).toBe('B');
      expect(determineFacetFromLongitude(13.0)).toBe('B');
    });

    it('should determine Facet C (Cognitive) at third facet boundary', () => {
      // Start of Cognitive: 11.25 + 2.8125 = 14.0625°
      expect(determineFacetFromLongitude(14.0625)).toBe('C');
      expect(determineFacetFromLongitude(14.5)).toBe('C');
    });

    it('should determine Facet D (Transpersonal) at fourth facet boundary', () => {
      // Start of Transpersonal: 11.25 + 4.21875 = 15.46875°
      expect(determineFacetFromLongitude(15.46875)).toBe('D');
      expect(determineFacetFromLongitude(15.9)).toBe('D');
    });

    it('should wrap correctly at 360° boundary', () => {
      // 11.25° and 371.25° (= 11.25° + 360°) should give the same facet
      expect(determineFacetFromLongitude(11.25)).toBe(
        determineFacetFromLongitude(371.25)
      );
    });

    it('should return A, B, C, or D for any longitude', () => {
      const testLons = [0, 45, 90, 135, 180, 225, 270, 315, 359.9];
      for (const lon of testLons) {
        const facet = determineFacetFromLongitude(lon);
        expect(['A', 'B', 'C', 'D']).toContain(facet);
      }
    });

    it('VRC validation vector - Conscious Sun 280.44 -> Codon 38 / Transpersonal / Root', () => {
      // Slot 47 → start = 47*5.625 + 11.25 = 275.625°; 280.44 - 275.625 = 4.815°
      // 4.815 / 1.40625 = 3.42 → facetIndex 3 = Transpersonal = D
      const resolved = longitudeToCodonFacet(280.44);
      expect(resolved.codon).toBe(38);
      expect(resolved.facet).toBe('Transpersonal');
      expect(resolved.center).toBe('Root');
      expect(determineFacetFromLongitude(280.44)).toBe('D');
    });

    it('VRC validation vector - Design Sun 192.44 -> Codon 57 / Somatic / Spleen', () => {
      const resolved = longitudeToCodonFacet(192.44);
      expect(resolved.codon).toBe(57);
      expect(resolved.facet).toBe('Somatic');
      expect(resolved.center).toBe('Spleen');
      expect(determineFacetFromLongitude(192.44)).toBe('A');
    });
  });

  describe('Canonical Codon Center Map', () => {
    it('matches Consciousness Lattice Unified Specification v1 for all 64 codons', () => {
      const actualCodons = Object.keys(CODON_CENTER_MAP)
        .map(Number)
        .sort((a, b) => a - b);
      expect(actualCodons).toEqual(
        Array.from({ length: 64 }, (_, index) => index + 1)
      );

      for (const [codon, expectedCenter] of Object.entries(
        EXPECTED_CODON_CENTERS
      )) {
        expect(CODON_CENTER_MAP[Number(codon)]).toBe(expectedCenter);
      }
    });

    it('guards the previously incorrect center assignments', () => {
      expect(CODON_CENTER_MAP[1]).toBe('G-Self');
      expect(CODON_CENTER_MAP[7]).toBe('G-Self');
      expect(CODON_CENTER_MAP[13]).toBe('G-Self');
      expect(CODON_CENTER_MAP[50]).toBe('Sacral');
    });
  });

  describe('Canonical Channel Graph', () => {
    it('matches the 36 spec channel pairs exactly', () => {
      expect(VRC_CHANNELS).toEqual(EXPECTED_CHANNELS);
    });

    it('guards channel count and uniqueness', () => {
      const channelIds = VRC_CHANNELS.map(([a, b]) => `${a}-${b}`);

      expect(VRC_CHANNELS).toHaveLength(36);
      expect(new Set(channelIds).size).toBe(36);
    });
  });

  describe('VRC Authority Hierarchy', () => {
    it('returns None/Outer for fully open Reflectors', () => {
      const centers = centersWith();

      expect(determineType(centers)).toBe('Reflector');
      expect(determineAuthority(centers, 'Reflector')).toBe('None/Outer');
      expect(determineAuthority(centers)).toBe('None/Outer');
    });

    it('returns Environment for mental/no-inner authority cases', () => {
      expect(determineType(centersWith(['Crown', 'Ajna']))).toBe('Harmonizer');
      expect(
        determineAuthority(centersWith(['Crown', 'Ajna']), 'Harmonizer')
      ).toBe('Environment');
      expect(determineAuthority(centersWith(['Root']), 'Harmonizer')).toBe(
        'Environment'
      );
    });

    it('prioritizes inner authority centers before Reflector or environment cases', () => {
      expect(
        determineAuthority(centersWith(['Solar Plexus', 'Sacral']), 'Resonator')
      ).toBe('Solar Plexus');
      expect(
        determineAuthority(centersWith(['Sacral', 'Spleen']), 'Resonator')
      ).toBe('Sacral');
      expect(
        determineAuthority(centersWith(['Spleen', 'Heart']), 'Harmonizer')
      ).toBe('Spleen');
      expect(
        determineAuthority(centersWith(['Heart', 'G-Self']), 'Harmonizer')
      ).toBe('Ego/Heart');
      expect(
        determineAuthority(centersWith(['G-Self', 'Crown']), 'Harmonizer')
      ).toBe('G-Center');
    });
  });

  describe('Facet Frequency Mapping', () => {
    it('should map Facet A to shadow frequency', () => {
      expect(getFacetFrequency('A')).toBe('shadow');
    });

    it('should map Facet B to gift frequency', () => {
      expect(getFacetFrequency('B')).toBe('gift');
    });

    it('should map Facet C to crown frequency', () => {
      expect(getFacetFrequency('C')).toBe('crown');
    });

    it('should map Facet D to siddhi frequency', () => {
      expect(getFacetFrequency('D')).toBe('siddhi');
    });
  });

  describe('Prime Stack Weighting', () => {
    it('should have 9 positions in Prime Stack', () => {
      expect(PRIME_STACK_CONFIG.length).toBe(9);
    });

    it('should have correct weights for each position', () => {
      expect(PRIME_STACK_CONFIG[0].weight).toBe(1.8); // Conscious Sun
      expect(PRIME_STACK_CONFIG[1].weight).toBe(1.3); // Conscious Earth
      expect(PRIME_STACK_CONFIG[2].weight).toBe(1.2); // Design Sun
    });

    it('should calculate weighted frequency correctly for position 1', () => {
      const weighted = calculateWeightedFrequency(1, 50);
      expect(weighted).toBe(90); // 50 * 1.8
    });

    it('should apply Conscious Earth weight (1.3x)', () => {
      const weighted = calculateWeightedFrequency(2, 50);
      expect(weighted).toBe(65); // 50 * 1.3
    });

    it('should apply Design True Node weight (0.6x)', () => {
      const weighted = calculateWeightedFrequency(8, 50);
      expect(weighted).toBe(30); // 50 * 0.6
    });
  });

  describe('SLI Calculation', () => {
    it('should calculate SLI correctly', () => {
      const sli = calculateSLI(100, 0.8, 0.9);
      expect(sli).toBe(72); // 100 * 0.8 * 0.9
    });

    it('should cap SLI at 100', () => {
      const sli = calculateSLI(100, 1.0, 1.0);
      expect(sli).toBe(100);
    });

    it('should return 0 for zero inputs', () => {
      const sli = calculateSLI(0, 0.5, 0.5);
      expect(sli).toBe(0);
    });

    it('should handle partial amplification', () => {
      const sli = calculateSLI(80, 0.5, 0.5);
      expect(sli).toBe(20); // 80 * 0.5 * 0.5
    });
  });

  describe('Facet Loudness Determination', () => {
    it('should determine facet loudness from coherence state', () => {
      const loudness = determineFacetLoudness(5, 3, 2);
      expect(loudness.A).toBeGreaterThan(0);
      expect(loudness.B).toBeGreaterThan(0);
      expect(loudness.C).toBeGreaterThan(0);
      expect(loudness.D).toBeGreaterThan(0);
    });

    it('should keep a non-zero baseline when noise is zero', () => {
      const loudness = determineFacetLoudness(0, 0, 0);
      expect(loudness.A).toBe(25);
      expect(loudness.B).toBe(25);
      expect(loudness.C).toBe(25);
      expect(loudness.D).toBe(25);
    });

    it('should raise body-linked facet amplitude with body tension', () => {
      const lowNoise  = determineFacetLoudness(0, 0, 0);
      const highNoise = determineFacetLoudness(10, 10, 10);
      expect(lowNoise.A).toBeLessThan(highNoise.A);
    });

    it('should map mental noise to Facet C prioritization', () => {
      const noMentalNoise   = determineFacetLoudness(0, 5, 5);
      const highMentalNoise = determineFacetLoudness(10, 5, 5);
      expect(noMentalNoise.C).toBeLessThan(highMentalNoise.C);
    });

    it('should prioritize facet A when body tension is dominant', () => {
      const loudness = determineFacetLoudness(2, 9, 3);
      expect(loudness.dominant).toBe('A');
    });
  });

  describe('256-Codon ID Generation', () => {
    it('should generate VRC format IDs (codonNumber-facet)', () => {
      const id = generateCodon256Id(38, 'A');
      expect(id).toBe('38-A');
    });

    it('should support legacy RC format round-trip', () => {
      const id = generateCodon256Id('RC01', 'A');
      expect(id).toBe('RC01-A');
      const parsed = parseCodon256Id('RC01-A');
      expect(parsed.rootCodonId).toBe('RC01');
      expect(parsed.facet).toBe('A');
      const regenerated = generateCodon256Id(parsed.rootCodonId, parsed.facet);
      expect(regenerated).toBe('RC01-A');
    });

    it('should parse VRC format 256-codon ID', () => {
      const parsed = parseCodon256Id('38-A');
      expect(parsed.codonNumber).toBe(38);
      expect(parsed.facet).toBe('A');
    });

    it('should generate IDs for all facets', () => {
      expect(generateCodon256Id(38, 'A')).toBe('38-A');
      expect(generateCodon256Id(38, 'B')).toBe('38-B');
      expect(generateCodon256Id(38, 'C')).toBe('38-C');
      expect(generateCodon256Id(38, 'D')).toBe('38-D');
    });
  });

  describe('State Amplifier Calculation', () => {
    it('should calculate state amplifier from coherence score', () => {
      // StateAmp = (100 - CS) / 100 — mid coherence → 0.5 amplifier
      expect(calculateStateAmplifier(50)).toBe(0.5);
    });

    it('should return 1 for zero coherence (shadow is loudest)', () => {
      expect(calculateStateAmplifier(0)).toBe(1);
    });

    it('should return 0 for perfect coherence (shadow is silent)', () => {
      expect(calculateStateAmplifier(100)).toBe(0);
    });

    it('should scale linearly with coherence (inverse)', () => {
      expect(calculateStateAmplifier(25)).toBe(0.75);
      expect(calculateStateAmplifier(75)).toBe(0.25);
    });

    it('should make lower coherence produce louder SLI', () => {
      const lowCoherenceSli = calculateSLI(90, calculateStateAmplifier(20), 1);
      const highCoherenceSli = calculateSLI(90, calculateStateAmplifier(80), 1);

      expect(lowCoherenceSli).toBeGreaterThan(highCoherenceSli);
    });
  });

  describe('Primary Interference Pattern', () => {
    it('should return 4 facets', () => {
      const loudness = determineFacetLoudness(5, 3, 2);
      const interference = calculatePrimaryInterference(loudness);
      expect(interference.length).toBe(4);
    });

    it('should sort facets by amplitude (descending)', () => {
      const loudness = determineFacetLoudness(5, 3, 2);
      const interference = calculatePrimaryInterference(loudness);
      for (let i = 0; i < interference.length - 1; i++) {
        expect(interference[i].amplitude).toBeGreaterThanOrEqual(interference[i + 1].amplitude);
      }
    });

    it('should include all four facets', () => {
      const loudness = determineFacetLoudness(5, 5, 5);
      const interference = calculatePrimaryInterference(loudness);
      const facets = interference.map(i => i.facet);
      expect(facets).toContain('A');
      expect(facets).toContain('B');
      expect(facets).toContain('C');
      expect(facets).toContain('D');
    });
  });

  describe('Validation', () => {
    it('should validate 256-codon resolution integrity', () => {
      const validation = validate256CodonResolution();
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should have sequential Prime Stack positions', () => {
      const positions = PRIME_STACK_CONFIG.map(p => p.position).sort((a, b) => a - b);
      expect(positions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
  });

  describe('Integration Tests', () => {
    it('should calculate complete SLI for a dynamic reading', () => {
      const coherenceScore = 65;
      const stateAmplifier = calculateStateAmplifier(coherenceScore);
      const facetLoudness = determineFacetLoudness(4, 3, 2);
      const sli = calculateSLI(75, stateAmplifier, facetLoudness.dominant === 'A' ? facetLoudness.A / 100 : 0.5);
      expect(sli).toBeGreaterThan(0);
      expect(sli).toBeLessThanOrEqual(100);
    });

    it('determineFacetFromLongitude returns consistent results', () => {
      // Two calls with the same longitude must give the same facet
      const lon = 123.456;
      expect(determineFacetFromLongitude(lon)).toBe(determineFacetFromLongitude(lon));
    });
  });
});
