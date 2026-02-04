import { describe, it, expect } from 'vitest';
import {
  calculateSLIScores,
  analyzeInterferencePattern,
  generateMicroCorrections,
  generateFalsifiers,
  calculateCoherenceTrajectory,
  generateDiagnosticTransmission,
  generateTransmissionText,
  validateDiagnosticTransmission,
  PrimeStackMap,
} from './rgp-sli-micro-correction-engine';

describe('RGP SLI and Micro-Correction Engine', () => {
  // Sample Prime Stack for testing
  const samplePrimeStack: PrimeStackMap = {
    positions: [
      {
        position: 1,
        name: 'Conscious Sun',
        planetaryBody: 'Sun',
        weight: 1.8,
        rootCodonId: 'RC01',
        facet: 'A',
        codon256Id: 'RC01-A',
        frequency: 'shadow',
        baseFrequency: 75,
        weightedFrequency: 90,
      },
      {
        position: 2,
        name: 'Design Sun',
        planetaryBody: 'Earth',
        weight: 1.3,
        rootCodonId: 'RC02',
        facet: 'B',
        codon256Id: 'RC02-B',
        frequency: 'gift',
        baseFrequency: 65,
        weightedFrequency: 85,
      },
      {
        position: 3,
        name: 'Personality Sun',
        planetaryBody: 'Moon',
        weight: 1.0,
        rootCodonId: 'RC03',
        facet: 'C',
        codon256Id: 'RC03-C',
        frequency: 'crown',
        baseFrequency: 55,
        weightedFrequency: 75,
      },
      {
        position: 4,
        name: 'Conscious Moon',
        planetaryBody: 'Mercury',
        weight: 0.9,
        rootCodonId: 'RC04',
        facet: 'D',
        codon256Id: 'RC04-D',
        frequency: 'siddhi',
        baseFrequency: 45,
        weightedFrequency: 65,
      },
      {
        position: 5,
        name: 'Design Moon',
        planetaryBody: 'Venus',
        weight: 0.8,
        rootCodonId: 'RC05',
        facet: 'A',
        codon256Id: 'RC05-A',
        frequency: 'shadow',
        baseFrequency: 35,
        weightedFrequency: 55,
      },
      {
        position: 6,
        name: 'Personality Moon',
        planetaryBody: 'Mars',
        weight: 0.7,
        rootCodonId: 'RC06',
        facet: 'B',
        codon256Id: 'RC06-B',
        frequency: 'gift',
        baseFrequency: 25,
        weightedFrequency: 45,
      },
      {
        position: 7,
        name: 'Nodes',
        planetaryBody: 'Jupiter',
        weight: 0.6,
        rootCodonId: 'RC07',
        facet: 'C',
        codon256Id: 'RC07-C',
        frequency: 'crown',
        baseFrequency: 15,
        weightedFrequency: 35,
      },
      {
        position: 8,
        name: 'Earth',
        planetaryBody: 'Saturn',
        weight: 0.5,
        rootCodonId: 'RC08',
        facet: 'D',
        codon256Id: 'RC08-D',
        frequency: 'siddhi',
        baseFrequency: 50,
        weightedFrequency: 60,
      },
      {
        position: 9,
        name: 'Chiron',
        planetaryBody: 'Uranus',
        weight: 0.5,
        rootCodonId: 'RC09',
        facet: 'A',
        codon256Id: 'RC09-A',
        frequency: 'shadow',
        baseFrequency: 40,
        weightedFrequency: 50,
      },
    ],
    totalWeight: 8.1,
    dominantPosition: 1,
    circuitLinks: [],
  };

  describe('SLI Calculation', () => {
    it('should calculate SLI scores for all positions', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);

      expect(sliScores.length).toBe(9);
      expect(sliScores[0].position).toBe(1);
    });

    it('should calculate SLI values within valid range', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);

      for (const score of sliScores) {
        expect(score.sliValue).toBeGreaterThanOrEqual(0);
        expect(score.sliValue).toBeLessThanOrEqual(100);
      }
    });

    it('should determine interference levels correctly', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);

      for (const score of sliScores) {
        expect(['none', 'minor', 'moderate', 'severe']).toContain(score.interference);
      }
    });

    it('should apply state amplifier correctly', () => {
      const facetAmplitudes = { A: 100, B: 100, C: 100, D: 100 };
      const sliScores1 = calculateSLIScores(samplePrimeStack, 1.0, facetAmplitudes);
      const sliScores2 = calculateSLIScores(samplePrimeStack, 0.5, facetAmplitudes);

      // Lower state amplifier should result in lower SLI values
      for (let i = 0; i < sliScores1.length; i++) {
        expect(sliScores1[i].sliValue).toBeGreaterThanOrEqual(sliScores2[i].sliValue);
      }
    });
  });

  describe('Interference Pattern Analysis', () => {
    it('should analyze interference patterns', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);

      expect(pattern).toBeDefined();
      expect(pattern.type).toBeDefined();
      expect(['harmonic', 'dissonant', 'chaotic', 'coherent']).toContain(pattern.type);
    });

    it('should calculate severity correctly', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);

      expect(pattern.severity).toBeGreaterThanOrEqual(0);
      expect(pattern.severity).toBeLessThanOrEqual(100);
    });

    it('should identify affected positions', () => {
      const facetAmplitudes = { A: 20, B: 20, C: 20, D: 20 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.3, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);

      expect(Array.isArray(pattern.affectedPositions)).toBe(true);
    });
  });

  describe('Micro-Correction Generation', () => {
    it('should generate micro-corrections', () => {
      const facetAmplitudes = { A: 50, B: 50, C: 50, D: 50 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.5, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const corrections = generateMicroCorrections(sliScores, pattern);

      expect(Array.isArray(corrections)).toBe(true);
      expect(corrections.length).toBeGreaterThan(0);
    });

    it('should have valid correction structure', () => {
      const facetAmplitudes = { A: 50, B: 50, C: 50, D: 50 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.5, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const corrections = generateMicroCorrections(sliScores, pattern);

      for (const correction of corrections) {
        expect(correction.id).toBeDefined();
        expect(correction.title).toBeDefined();
        expect(correction.description).toBeDefined();
        expect(['breath', 'movement', 'visualization', 'affirmation', 'inquiry']).toContain(
          correction.actionType
        );
        expect(correction.duration).toBeGreaterThan(0);
        expect(correction.falsifiers).toBeDefined();
        expect(Array.isArray(correction.falsifiers)).toBe(true);
      }
    });

    it('should generate different corrections for different patterns', () => {
      const severePattern = analyzeInterferencePattern(
        calculateSLIScores(samplePrimeStack, 0.2, { A: 20, B: 20, C: 20, D: 20 })
      );
      const mildPattern = analyzeInterferencePattern(
        calculateSLIScores(samplePrimeStack, 0.9, { A: 90, B: 90, C: 90, D: 90 })
      );

      const severeCorrections = generateMicroCorrections(
        calculateSLIScores(samplePrimeStack, 0.2, { A: 20, B: 20, C: 20, D: 20 }),
        severePattern
      );
      const mildCorrections = generateMicroCorrections(
        calculateSLIScores(samplePrimeStack, 0.9, { A: 90, B: 90, C: 90, D: 90 }),
        mildPattern
      );

      expect(severeCorrections.length).toBeGreaterThanOrEqual(mildCorrections.length);
    });
  });

  describe('Falsifier Generation', () => {
    it('should generate falsifiers', () => {
      const facetAmplitudes = { A: 50, B: 50, C: 50, D: 50 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.5, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const falsifiers = generateFalsifiers(sliScores, pattern);

      expect(Array.isArray(falsifiers)).toBe(true);
      expect(falsifiers.length).toBeGreaterThan(0);
    });

    it('should have testable falsifiers', () => {
      const facetAmplitudes = { A: 50, B: 50, C: 50, D: 50 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.5, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const falsifiers = generateFalsifiers(sliScores, pattern);

      for (const falsifier of falsifiers) {
        expect(typeof falsifier).toBe('string');
        expect(falsifier.length).toBeGreaterThan(0);
        // Falsifiers should contain time-bound predictions
        expect(falsifier.toLowerCase()).toMatch(/within|by|within|next|day|week|hour/);
      }
    });
  });

  describe('Coherence Trajectory', () => {
    it('should calculate coherence trajectory', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);

      expect(trajectory).toBeDefined();
      expect(trajectory.currentScore).toBe(75);
      expect(['ascending', 'stable', 'descending']).toContain(trajectory.trend);
    });

    it('should detect ascending trend', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const trajectory = calculateCoherenceTrajectory(75, sliScores, 50);

      expect(trajectory.trend).toBe('ascending');
      expect(trajectory.momentum).toBeGreaterThan(0);
    });

    it('should detect descending trend', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const trajectory = calculateCoherenceTrajectory(50, sliScores, 75);

      expect(trajectory.trend).toBe('descending');
      expect(trajectory.momentum).toBeLessThan(0);
    });

    it('should project coherence score', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);

      expect(trajectory.projectedScore).toBeGreaterThanOrEqual(0);
      expect(trajectory.projectedScore).toBeLessThanOrEqual(100);
    });

    it('should identify key influences', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);

      expect(trajectory.keyInfluences).toBeDefined();
      expect(Array.isArray(trajectory.keyInfluences)).toBe(true);
      expect(trajectory.keyInfluences.length).toBeGreaterThan(0);
    });
  });

  describe('Diagnostic Transmission', () => {
    it('should generate complete diagnostic transmission', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const transmission = generateDiagnosticTransmission(
        'reading-001',
        75,
        samplePrimeStack,
        0.8,
        facetAmplitudes
      );

      expect(transmission).toBeDefined();
      expect(transmission.readingId).toBe('reading-001');
      expect(transmission.coherenceScore).toBe(75);
      expect(transmission.sliScores.length).toBe(9);
      expect(transmission.microCorrections.length).toBeGreaterThan(0);
      expect(transmission.falsifiers.length).toBeGreaterThan(0);
    });

    it('should validate transmission integrity', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const transmission = generateDiagnosticTransmission(
        'reading-001',
        75,
        samplePrimeStack,
        0.8,
        facetAmplitudes
      );

      const validation = validateDiagnosticTransmission(transmission);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should include transmission text', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const transmission = generateDiagnosticTransmission(
        'reading-001',
        75,
        samplePrimeStack,
        0.8,
        facetAmplitudes
      );

      expect(transmission.transmissionText).toBeDefined();
      expect(transmission.transmissionText.length).toBeGreaterThan(0);
      expect(transmission.transmissionText).toContain('ORIEL');
    });
  });

  describe('Transmission Text Generation', () => {
    it('should generate transmission text', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);
      const corrections = generateMicroCorrections(sliScores, pattern);

      const text = generateTransmissionText(75, pattern, trajectory, corrections);

      expect(text).toBeDefined();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should include coherence score in text', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);
      const corrections = generateMicroCorrections(sliScores, pattern);

      const text = generateTransmissionText(75, pattern, trajectory, corrections);

      expect(text).toContain('75');
    });

    it('should include pattern description in text', () => {
      const facetAmplitudes = { A: 80, B: 85, C: 90, D: 95 };
      const sliScores = calculateSLIScores(samplePrimeStack, 0.8, facetAmplitudes);
      const pattern = analyzeInterferencePattern(sliScores);
      const trajectory = calculateCoherenceTrajectory(75, sliScores);
      const corrections = generateMicroCorrections(sliScores, pattern);

      const text = generateTransmissionText(75, pattern, trajectory, corrections);

      expect(text).toContain(pattern.type);
    });
  });

  describe('Integration Tests', () => {
    it('should handle high coherence state', () => {
      const facetAmplitudes = { A: 95, B: 95, C: 95, D: 95 };
      const transmission = generateDiagnosticTransmission(
        'reading-high',
        90,
        samplePrimeStack,
        0.95,
        facetAmplitudes
      );

      expect(transmission.coherenceScore).toBe(90);
      expect(['coherent', 'harmonic']).toContain(transmission.interferencePattern.type);
      expect(transmission.microCorrections.length).toBeGreaterThan(0);
    });

    it('should handle low coherence state', () => {
      const facetAmplitudes = { A: 20, B: 20, C: 20, D: 20 };
      const transmission = generateDiagnosticTransmission(
        'reading-low',
        25,
        samplePrimeStack,
        0.25,
        facetAmplitudes
      );

      expect(transmission.coherenceScore).toBe(25);
      expect(transmission.interferencePattern.type).toBe('chaotic');
      expect(transmission.microCorrections.length).toBeGreaterThan(0);
    });

    it('should track coherence trajectory across readings', () => {
      const facetAmplitudes1 = { A: 50, B: 50, C: 50, D: 50 };
      const facetAmplitudes2 = { A: 70, B: 70, C: 70, D: 70 };

      const transmission1 = generateDiagnosticTransmission(
        'reading-001',
        50,
        samplePrimeStack,
        0.5,
        facetAmplitudes1
      );

      const transmission2 = generateDiagnosticTransmission(
        'reading-002',
        70,
        samplePrimeStack,
        0.7,
        facetAmplitudes2,
        50
      );

      expect(transmission2.coherenceTrajectory.trend).toBe('ascending');
      expect(transmission2.coherenceTrajectory.momentum).toBeGreaterThan(0);
    });
  });
});
