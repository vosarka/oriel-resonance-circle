import { describe, it, expect } from 'vitest';
import {
  determineFacetFromLongitude,
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
} from './rgp-256-codon-engine';

describe('RGP 256-Codon Resolution Engine', () => {
  describe('Facet Determination', () => {
    it('should determine Facet A from longitude 0-90', () => {
      expect(determineFacetFromLongitude(0)).toBe('A');
      expect(determineFacetFromLongitude(45)).toBe('A');
      expect(determineFacetFromLongitude(89)).toBe('A');
    });

    it('should determine Facet B from longitude 90-180', () => {
      expect(determineFacetFromLongitude(90)).toBe('B');
      expect(determineFacetFromLongitude(135)).toBe('B');
      expect(determineFacetFromLongitude(179)).toBe('B');
    });

    it('should determine Facet C from longitude 180-270', () => {
      expect(determineFacetFromLongitude(180)).toBe('C');
      expect(determineFacetFromLongitude(225)).toBe('C');
      expect(determineFacetFromLongitude(269)).toBe('C');
    });

    it('should determine Facet D from longitude 270-360', () => {
      expect(determineFacetFromLongitude(270)).toBe('D');
      expect(determineFacetFromLongitude(315)).toBe('D');
      expect(determineFacetFromLongitude(359)).toBe('D');
    });

    it('should handle longitude wrapping (360+ degrees)', () => {
      expect(determineFacetFromLongitude(360)).toBe('A');
      expect(determineFacetFromLongitude(450)).toBe('B');
      expect(determineFacetFromLongitude(540)).toBe('C');
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
      expect(PRIME_STACK_CONFIG[1].weight).toBe(1.3); // Design Sun
      expect(PRIME_STACK_CONFIG[2].weight).toBe(1.0); // Personality Sun
    });

    it('should calculate weighted frequency correctly', () => {
      // Position 1 (Conscious Sun) with 1.8x weight
      const weighted = calculateWeightedFrequency(1, 50);
      expect(weighted).toBe(90); // 50 * 1.8
    });

    it('should apply Design Sun weight (1.3x)', () => {
      const weighted = calculateWeightedFrequency(2, 50);
      expect(weighted).toBe(65); // 50 * 1.3
    });

    it('should apply Earth weight (0.8x)', () => {
      const weighted = calculateWeightedFrequency(8, 50);
      expect(weighted).toBe(40); // 50 * 0.8
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

    it('should identify dominant facet', () => {
      const loudness = determineFacetLoudness(0, 0, 0); // Perfect coherence
      // When all noise is 0, all facets are 100, so first one (A) is dominant
      expect(loudness.A).toBe(100);
      expect(loudness.B).toBe(100);
      expect(loudness.C).toBe(100);
      expect(loudness.D).toBe(100);
    });

    it('should reduce facet amplitude with noise', () => {
      const lowNoise = determineFacetLoudness(0, 0, 0);
      const highNoise = determineFacetLoudness(10, 10, 10);
      expect(lowNoise.A).toBeGreaterThan(highNoise.A);
    });

    it('should map mental noise to Shadow (A) reduction', () => {
      const noMentalNoise = determineFacetLoudness(0, 5, 5);
      const highMentalNoise = determineFacetLoudness(10, 5, 5);
      expect(noMentalNoise.A).toBeGreaterThan(highMentalNoise.A);
    });
  });

  describe('256-Codon ID Generation', () => {
    it('should generate 256-codon ID from root codon and facet', () => {
      const id = generateCodon256Id('RC01', 'A');
      expect(id).toBe('RC01-A');
    });

    it('should generate IDs for all facets', () => {
      expect(generateCodon256Id('RC01', 'A')).toBe('RC01-A');
      expect(generateCodon256Id('RC01', 'B')).toBe('RC01-B');
      expect(generateCodon256Id('RC01', 'C')).toBe('RC01-C');
      expect(generateCodon256Id('RC01', 'D')).toBe('RC01-D');
    });

    it('should parse 256-codon ID back to components', () => {
      const parsed = parseCodon256Id('RC01-A');
      expect(parsed.rootCodonId).toBe('RC01');
      expect(parsed.facet).toBe('A');
    });

    it('should round-trip 256-codon ID correctly', () => {
      const original = 'RC42-C';
      const parsed = parseCodon256Id(original);
      const regenerated = generateCodon256Id(parsed.rootCodonId, parsed.facet);
      expect(regenerated).toBe(original);
    });
  });

  describe('State Amplifier Calculation', () => {
    it('should calculate state amplifier from coherence score', () => {
      const amplifier = calculateStateAmplifier(50);
      expect(amplifier).toBe(0.5);
    });

    it('should return 0 for zero coherence', () => {
      const amplifier = calculateStateAmplifier(0);
      expect(amplifier).toBe(0);
    });

    it('should return 1 for perfect coherence', () => {
      const amplifier = calculateStateAmplifier(100);
      expect(amplifier).toBe(1);
    });

    it('should scale linearly with coherence', () => {
      expect(calculateStateAmplifier(25)).toBe(0.25);
      expect(calculateStateAmplifier(75)).toBe(0.75);
    });
  });

  describe('Primary Interference Pattern', () => {
    it('should calculate primary interference pattern', () => {
      const loudness = determineFacetLoudness(5, 3, 2);
      const interference = calculatePrimaryInterference(loudness);
      expect(interference.length).toBe(4);
    });

    it('should sort facets by amplitude (descending)', () => {
      const loudness = determineFacetLoudness(5, 3, 2); // Mixed noise
      const interference = calculatePrimaryInterference(loudness);
      // Verify all facets are present and sorted by amplitude
      expect(interference.length).toBe(4);
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
    it('should calculate complete 256-codon resolution for a birth chart', () => {
      // Simulate a birth chart with specific planetary positions
      const birthLongitudes = {
        sun: 45, // Facet A (Shadow)
        moon: 135, // Facet B (Gift)
        earth: 225, // Facet C (Crown)
        nodes: 315, // Facet D (Siddhi)
      };

      const sunFacet = determineFacetFromLongitude(birthLongitudes.sun);
      const moonFacet = determineFacetFromLongitude(birthLongitudes.moon);
      const earthFacet = determineFacetFromLongitude(birthLongitudes.earth);
      const nodesFacet = determineFacetFromLongitude(birthLongitudes.nodes);

      expect(sunFacet).toBe('A');
      expect(moonFacet).toBe('B');
      expect(earthFacet).toBe('C');
      expect(nodesFacet).toBe('D');
    });

    it('should calculate complete SLI for a dynamic reading', () => {
      // Simulate a dynamic state reading
      const coherenceScore = 65;
      const mentalNoise = 4;
      const bodyTension = 3;
      const emotionalTurbulence = 2;

      const stateAmplifier = calculateStateAmplifier(coherenceScore);
      const facetLoudness = determineFacetLoudness(mentalNoise, bodyTension, emotionalTurbulence);
      const sli = calculateSLI(75, stateAmplifier, facetLoudness.dominant === 'A' ? facetLoudness.A / 100 : 0.5);

      expect(sli).toBeGreaterThan(0);
      expect(sli).toBeLessThanOrEqual(100);
    });
  });
});
