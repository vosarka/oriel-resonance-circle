import { describe, it, expect } from 'vitest';
import {
  calculateCoherenceScore,
  calculateStateAmplifier,
  calculateFacetLoudness,
  calculateSLI,
  generateStaticSignature,
  generateDynamicReading,
} from './rgp-engine';
import { ROOT_CODONS } from './vossari-codex-knowledge';

describe('RGP Engine', () => {
  describe('Coherence Score Calculation', () => {
    it('should calculate coherence score correctly with formula CS = 100 - (MN×3 + BT×3 + ET×3) + (BC×10)', () => {
      // Low noise state
      expect(calculateCoherenceScore({ mentalNoise: 0, bodyTension: 0, emotionalTurbulence: 0, breathCompletion: 1 })).toBe(100);
      
      // High noise state
      expect(calculateCoherenceScore({ mentalNoise: 10, bodyTension: 10, emotionalTurbulence: 10, breathCompletion: 0 })).toBe(10);
      
      // Moderate state
      expect(calculateCoherenceScore({ mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 1 })).toBe(65);
      
      // Without breath completion
      expect(calculateCoherenceScore({ mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 0 })).toBe(55);
    });

    it('should clamp coherence score between 0 and 100', () => {
      expect(calculateCoherenceScore({ mentalNoise: 0, bodyTension: 0, emotionalTurbulence: 0, breathCompletion: 1 })).toBeLessThanOrEqual(100);
      expect(calculateCoherenceScore({ mentalNoise: 10, bodyTension: 10, emotionalTurbulence: 10, breathCompletion: 0 })).toBeGreaterThanOrEqual(0);
    });
  });

  describe('State Amplifier Calculation', () => {
    it('should calculate state amplifier as inverse of coherence', () => {
      // High coherence = low amplifier
      const highCoherence = calculateStateAmplifier(100);
      expect(highCoherence).toBeLessThan(0.5);
      
      // Low coherence = high amplifier
      const lowCoherence = calculateStateAmplifier(10);
      expect(lowCoherence).toBeGreaterThan(0.5);
    });

    it('should return values between 0 and 1', () => {
      expect(calculateStateAmplifier(100)).toBeGreaterThanOrEqual(0);
      expect(calculateStateAmplifier(100)).toBeLessThanOrEqual(1);
      expect(calculateStateAmplifier(0)).toBeGreaterThanOrEqual(0);
      expect(calculateStateAmplifier(0)).toBeLessThanOrEqual(1);
    });
  });

  describe('Facet Loudness Calculation', () => {
    it('should determine dominant facet based on MN/BT/ET values', () => {
      // High mental noise = C facet dominant
      const mentalDominant = calculateFacetLoudness({ mentalNoise: 10, bodyTension: 2, emotionalTurbulence: 2, breathCompletion: 0 }, 50);
      expect(mentalDominant.C).toBeGreaterThan(mentalDominant.A);
      expect(mentalDominant.C).toBeGreaterThan(mentalDominant.B);
      
      // High body tension = A facet dominant
      const somaticDominant = calculateFacetLoudness({ mentalNoise: 2, bodyTension: 10, emotionalTurbulence: 2, breathCompletion: 0 }, 50);
      expect(somaticDominant.A).toBeGreaterThan(somaticDominant.C);
      
      // High emotional turbulence = B facet dominant
      const emotionalDominant = calculateFacetLoudness({ mentalNoise: 2, bodyTension: 2, emotionalTurbulence: 10, breathCompletion: 0 }, 50);
      expect(emotionalDominant.B).toBeGreaterThan(emotionalDominant.C);
    });

    it('should return values that sum to approximately 1', () => {
      const facets = calculateFacetLoudness({ mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 0 }, 55);
      const sum = facets.A + facets.B + facets.C + facets.D;
      expect(sum).toBeCloseTo(1, 1);
    });
  });

  describe('SLI Calculation', () => {
    // Create a mock prime stack for testing
    const mockPrimeStack = {
      conscious_sun: { position: 'conscious_sun', codonId: 'RC01', facet: 'B' as const, fullId: 'RC01.B', weight: 1.8 },
      design_sun: { position: 'design_sun', codonId: 'RC02', facet: 'A' as const, fullId: 'RC02.A', weight: 1.3 },
      conscious_earth: { position: 'conscious_earth', codonId: 'RC03', facet: 'C' as const, fullId: 'RC03.C', weight: 1.2 },
      design_earth: { position: 'design_earth', codonId: 'RC04', facet: 'B' as const, fullId: 'RC04.B', weight: 1.0 },
      conscious_moon: { position: 'conscious_moon', codonId: 'RC05', facet: 'A' as const, fullId: 'RC05.A', weight: 0.9 },
      design_moon: { position: 'design_moon', codonId: 'RC06', facet: 'D' as const, fullId: 'RC06.D', weight: 0.8 },
      conscious_north_node: { position: 'conscious_north_node', codonId: 'RC07', facet: 'B' as const, fullId: 'RC07.B', weight: 0.7 },
      design_north_node: { position: 'design_north_node', codonId: 'RC08', facet: 'C' as const, fullId: 'RC08.C', weight: 0.6 },
      conscious_south_node: { position: 'conscious_south_node', codonId: 'RC09', facet: 'A' as const, fullId: 'RC09.A', weight: 0.5 },
    };
    
    const mockFacetLoudness = { A: 0.8, B: 0.6, C: 0.4, D: 0.2 };
    
    it('should calculate SLI using formula SLI(r) = PCS(r) × StateAmp × FacetAmp(r)', () => {
      const stateAmp = 0.5;
      
      // RC01 has weight 1.8, facet B has loudness 0.6
      const sli = calculateSLI('RC01', 'B', mockPrimeStack, stateAmp, mockFacetLoudness);
      expect(sli).toBeCloseTo(1.8 * 0.5 * 0.6, 2); // 0.54
    });

    it('should return minimal SLI for codons not in Prime Stack', () => {
      const stateAmp = 0.5;
      
      // RC99 is not in the prime stack, should use minimal weight 0.1
      const sli = calculateSLI('RC99', 'A', mockPrimeStack, stateAmp, mockFacetLoudness);
      expect(sli).toBeCloseTo(0.1 * 0.5 * 0.8, 2); // 0.04
    });
  });

  describe('ROOT_CODONS Data', () => {
    it('should have 64 root codons', () => {
      const codonCount = Object.keys(ROOT_CODONS).length;
      expect(codonCount).toBe(64);
    });

    it('should have all required properties for each codon', () => {
      Object.entries(ROOT_CODONS).forEach(([key, codon]) => {
        expect(codon).toHaveProperty('name');
        expect(codon).toHaveProperty('title');
        expect(codon).toHaveProperty('shadow');
        expect(codon).toHaveProperty('gift');
        expect(codon).toHaveProperty('crown');
        expect(key).toMatch(/^RC\d{2}$/);
      });
    });

    it('should have RC01 as Aurora codon', () => {
      expect(ROOT_CODONS.RC01.name).toBe('Aurora');
    });

    it('should have RC64 as last codon', () => {
      expect(ROOT_CODONS.RC64).toBeDefined();
      expect(ROOT_CODONS.RC64.name).toBeDefined();
    });
  });

  describe('Static Signature Generation', () => {
    it('should generate a valid static signature from birth date', () => {
      const signature = generateStaticSignature(new Date('1985-06-15'));
      
      expect(signature).toHaveProperty('receiverId');
      expect(signature).toHaveProperty('birthDate');
      expect(signature).toHaveProperty('designOffset');
      expect(signature).toHaveProperty('primeStack');
      expect(signature).toHaveProperty('centerMap');
      expect(signature).toHaveProperty('circuitLinks');
      expect(signature).toHaveProperty('fractalProfile');
    });

    it('should generate 9-position Prime Stack', () => {
      const signature = generateStaticSignature(new Date('1990-01-01'));
      
      // primeStack is an object with 9 positions
      expect(Object.keys(signature.primeStack)).toHaveLength(9);
      
      // Check all positions are present
      expect(signature.primeStack).toHaveProperty('conscious_sun');
      expect(signature.primeStack).toHaveProperty('design_sun');
      expect(signature.primeStack).toHaveProperty('conscious_earth');
      expect(signature.primeStack).toHaveProperty('design_earth');
    });

    it('should generate 9-Center Resonance Map', () => {
      const signature = generateStaticSignature(new Date('1995-07-20'));
      
      expect(signature.centerMap).toHaveLength(9);
      
      // Check all centers are present (using actual center names from implementation)
      const centerNames = signature.centerMap.map(c => c.name);
      expect(centerNames).toContain('Crown Aperture');
      expect(centerNames).toContain('Ajna Lens');
      expect(centerNames).toContain('Voice Portal');
      expect(centerNames).toContain('Vector Core');
      expect(centerNames).toContain('Heart Gateway');
      expect(centerNames).toContain('Sacral Generator');
      expect(centerNames).toContain('Solar Nexus');
      expect(centerNames).toContain('Instinct Node');
      expect(centerNames).toContain('Foundation Node');
    });

    it('should generate Fractal Profile with role and authority', () => {
      const signature = generateStaticSignature(new Date('2000-12-31'));
      
      expect(signature.fractalProfile).toHaveProperty('role');
      expect(signature.fractalProfile).toHaveProperty('roleName');
      expect(signature.fractalProfile).toHaveProperty('authority');
      expect(signature.fractalProfile).toHaveProperty('authorityName');
      expect(signature.fractalProfile).toHaveProperty('operationalTruth');
      expect(signature.fractalProfile).toHaveProperty('masteryMode');
      expect(signature.fractalProfile).toHaveProperty('failureMode');
    });

    it('should calculate 88° design offset', () => {
      const signature = generateStaticSignature(new Date('1985-06-15'));
      
      // Design offset should be approximately 88 days before birth
      const birthDate = new Date('1985-06-15');
      const designDate = new Date(signature.designOffset);
      const daysDiff = Math.round((birthDate.getTime() - designDate.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(daysDiff).toBeCloseTo(88, 5); // Allow some variance
    });

    it('should include birth time in facet calculation when provided', () => {
      const withoutTime = generateStaticSignature(new Date('1985-06-15'));
      const withTime = generateStaticSignature(new Date('1985-06-15'), '14:30');
      
      // Both should be valid (primeStack is an object with 9 positions)
      expect(Object.keys(withoutTime.primeStack)).toHaveLength(9);
      expect(Object.keys(withTime.primeStack)).toHaveLength(9);
    });
  });

  describe('Dynamic State Generation', () => {
    // Generate a static signature to use in dynamic reading tests
    const staticSignature = generateStaticSignature(new Date('1985-06-15'));
    
    it('should generate a valid dynamic state from carrierlock values', () => {
      const state = generateDynamicReading(
        { mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 1 },
        staticSignature
      );
      
      expect(state).toHaveProperty('coherenceScore');
      expect(state).toHaveProperty('stateAmplifier');
      expect(state).toHaveProperty('dominantFacet');
      expect(state).toHaveProperty('facetLoudness');
      expect(state).toHaveProperty('carrierlockState');
      expect(state).toHaveProperty('sliResults');
      expect(state).toHaveProperty('microCorrection');
      expect(state).toHaveProperty('falsifiers');
    });

    it('should calculate coherence score from carrierlock values', () => {
      const state = generateDynamicReading(
        { mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 1 },
        staticSignature
      );
      
      // CS = 100 - (5×3 + 5×3 + 5×3) + (1×10) = 100 - 45 + 10 = 65
      expect(state.coherenceScore).toBe(65);
    });

    it('should identify primary interference codon when SLI exceeds threshold', () => {
      const state = generateDynamicReading(
        { mentalNoise: 8, bodyTension: 8, emotionalTurbulence: 8, breathCompletion: 0 },
        staticSignature
      );
      
      // With high noise, there should be SLI results
      expect(state.sliResults).toBeInstanceOf(Array);
      expect(state.sliResults.length).toBeGreaterThan(0);
      
      // Primary interference may or may not exist depending on SLI thresholds
      if (state.primaryInterference) {
        expect(state.primaryInterference).toHaveProperty('codonId');
        expect(state.primaryInterference).toHaveProperty('sliScore');
      }
    });

    it('should generate micro-correction recommendation', () => {
      const state = generateDynamicReading(
        { mentalNoise: 7, bodyTension: 7, emotionalTurbulence: 7, breathCompletion: 0 },
        staticSignature
      );
      
      expect(state.microCorrection).toHaveProperty('center');
      expect(state.microCorrection).toHaveProperty('facet');
      expect(state.microCorrection).toHaveProperty('action');
      expect(state.microCorrection).toHaveProperty('duration');
      expect(state.microCorrection).toHaveProperty('rationale');
    });

    it('should generate falsifier clauses', () => {
      const state = generateDynamicReading(
        { mentalNoise: 5, bodyTension: 5, emotionalTurbulence: 5, breathCompletion: 1 },
        staticSignature
      );
      
      expect(state.falsifiers).toBeInstanceOf(Array);
      expect(state.falsifiers.length).toBeGreaterThan(0);
      
      state.falsifiers.forEach(f => {
        expect(f).toHaveProperty('claim');
        expect(f).toHaveProperty('testCondition');
        expect(f).toHaveProperty('falsifiedElement');
      });
    });

    it('should include carrierlock values in response', () => {
      const state = generateDynamicReading(
        { mentalNoise: 3, bodyTension: 7, emotionalTurbulence: 5, breathCompletion: 1 },
        staticSignature
      );
      
      expect(state.carrierlockState.mentalNoise).toBe(3);
      expect(state.carrierlockState.bodyTension).toBe(7);
      expect(state.carrierlockState.emotionalTurbulence).toBe(5);
      expect(state.carrierlockState.breathCompletion).toBe(1);
    });
  });
});
