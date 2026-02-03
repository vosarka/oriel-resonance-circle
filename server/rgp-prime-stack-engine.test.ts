import { describe, it, expect } from 'vitest';
import {
  calculatePrimeStack,
  calculateCircuitLinks,
  calculate9CenterMap,
  calculateFractalRole,
  calculateAuthorityNode,
  validatePrimeStack,
  generatePrimeStackSummary,
  BirthChartData,
} from './rgp-prime-stack-engine';

describe('RGP Prime Stack Calculation Engine', () => {
  // Sample birth chart for testing
  const sampleBirthChart: BirthChartData = {
    sun: { body: 'Sun', longitude: 45 },
    moon: { body: 'Moon', longitude: 135 },
    earth: { body: 'Earth', longitude: 225 },
    nodes: { body: 'Nodes', longitude: 315 },
    chiron: { body: 'Chiron', longitude: 90 },
  };

  const rootCodonMap: Record<string, string> = {
    sun: 'RC01',
    earth: 'RC02',
    moon: 'RC03',
    nodes: 'RC04',
    chiron: 'RC05',
  };

  describe('Prime Stack Calculation', () => {
    it('should calculate Prime Stack from birth chart', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      expect(primeStack).toBeDefined();
      expect(primeStack.positions).toBeDefined();
    });

    it('should have 9 positions in Prime Stack', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      expect(primeStack.positions.length).toBe(9);
    });

    it('should assign correct codon 256 IDs', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      for (const position of primeStack.positions) {
        expect(position.codon256Id).toMatch(/^RC\d{2}-[ABCD]$/);
      }
    });

    it('should calculate weighted frequencies', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      for (const position of primeStack.positions) {
        expect(position.weightedFrequency).toBeGreaterThanOrEqual(0);
        expect(position.weightedFrequency).toBeLessThanOrEqual(100);
      }
    });

    it('should identify dominant position', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      expect(primeStack.dominantPosition).toBeGreaterThanOrEqual(1);
      expect(primeStack.dominantPosition).toBeLessThanOrEqual(9);
    });

    it('should calculate total weight', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      expect(primeStack.totalWeight).toBeGreaterThan(0);
    });

    it('should map facets correctly from longitudes', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      for (const position of primeStack.positions) {
        expect(['A', 'B', 'C', 'D']).toContain(position.facet);
      }
    });
  });

  describe('Circuit Links', () => {
    it('should calculate circuit links between positions', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      expect(primeStack.circuitLinks).toBeDefined();
      expect(Array.isArray(primeStack.circuitLinks)).toBe(true);
    });

    it('should identify link types correctly', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      for (const link of primeStack.circuitLinks) {
        expect(['harmonic', 'opposition', 'square', 'trine']).toContain(link.linkType);
      }
    });

    it('should have strength values within range', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      for (const link of primeStack.circuitLinks) {
        expect(link.strength).toBeGreaterThanOrEqual(0);
        expect(link.strength).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('9-Center Resonance Map', () => {
    it('should calculate 9-Center map', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const nineCenter = calculate9CenterMap(primeStack);
      expect(nineCenter).toBeDefined();
    });

    it('should have all 9 centers', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const nineCenter = calculate9CenterMap(primeStack);
      expect(Object.keys(nineCenter).length).toBe(9);
    });

    it('should assign correct center names', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const nineCenter = calculate9CenterMap(primeStack);
      expect(nineCenter[1].centerName).toBe('Crown Center');
      expect(nineCenter[9].centerName).toBe('Void Center');
    });

    it('should include codon 256 IDs', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const nineCenter = calculate9CenterMap(primeStack);
      for (const center of Object.values(nineCenter)) {
        expect(center.codon256Id).toMatch(/^RC\d{2}-[ABCD]$/);
      }
    });
  });

  describe('Fractal Role Calculation', () => {
    it('should calculate fractal role', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const role = calculateFractalRole(primeStack);
      expect(role).toBeDefined();
      expect(role.role).toBeDefined();
      expect(role.description).toBeDefined();
      expect(role.alignment).toBeDefined();
    });

    it('should identify valid role types', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const role = calculateFractalRole(primeStack);
      expect(['Reflector', 'Resonator', 'Catalyst', 'Harmonizer']).toContain(role.role);
    });

    it('should calculate alignment percentage', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const role = calculateFractalRole(primeStack);
      expect(role.alignment).toBeGreaterThanOrEqual(0);
      expect(role.alignment).toBeLessThanOrEqual(100);
    });
  });

  describe('Authority Node Calculation', () => {
    it('should calculate authority node', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority).toBeDefined();
      expect(authority.node).toBeDefined();
      expect(authority.position).toBeDefined();
      expect(authority.strength).toBeDefined();
    });

    it('should identify valid authority positions', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority.position).toBeGreaterThanOrEqual(1);
      expect(authority.position).toBeLessThanOrEqual(9);
    });

    it('should have authority strength within range', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority.strength).toBeGreaterThanOrEqual(0);
      expect(authority.strength).toBeLessThanOrEqual(100);
    });
  });

  describe('Validation', () => {
    it('should validate Prime Stack integrity', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const validation = validatePrimeStack(primeStack);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect missing positions', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      primeStack.positions = primeStack.positions.slice(0, 5);
      const validation = validatePrimeStack(primeStack);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid frequencies', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      primeStack.positions[0].weightedFrequency = 150; // Invalid
      const validation = validatePrimeStack(primeStack);
      expect(validation.valid).toBe(false);
    });
  });

  describe('Prime Stack Summary', () => {
    it('should generate Prime Stack summary', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const summary = generatePrimeStackSummary(primeStack);
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should include all positions in summary', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const summary = generatePrimeStackSummary(primeStack);
      for (let i = 1; i <= 9; i++) {
        expect(summary).toContain(`${i}.`);
      }
    });

    it('should include fractal role in summary', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const summary = generatePrimeStackSummary(primeStack);
      expect(summary).toContain('Fractal Role');
    });

    it('should include authority node in summary', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const summary = generatePrimeStackSummary(primeStack);
      expect(summary).toContain('Authority Node');
    });
  });

  describe('Integration Tests', () => {
    it('should handle different birth chart configurations', () => {
      const alternativeBirthChart: BirthChartData = {
        sun: { body: 'Sun', longitude: 0 },
        moon: { body: 'Moon', longitude: 90 },
        earth: { body: 'Earth', longitude: 180 },
        nodes: { body: 'Nodes', longitude: 270 },
        chiron: { body: 'Chiron', longitude: 45 },
      };

      const primeStack = calculatePrimeStack(alternativeBirthChart, rootCodonMap);
      expect(primeStack.positions.length).toBe(9);
      expect(primeStack.dominantPosition).toBeGreaterThanOrEqual(1);
    });

    it('should maintain consistency across multiple calculations', () => {
      const primeStack1 = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const primeStack2 = calculatePrimeStack(sampleBirthChart, rootCodonMap);

      expect(primeStack1.dominantPosition).toBe(primeStack2.dominantPosition);
      expect(primeStack1.positions.length).toBe(primeStack2.positions.length);

      for (let i = 0; i < primeStack1.positions.length; i++) {
        expect(primeStack1.positions[i].codon256Id).toBe(primeStack2.positions[i].codon256Id);
      }
    });

    it('should generate complete diagnostic from Prime Stack', () => {
      const primeStack = calculatePrimeStack(sampleBirthChart, rootCodonMap);
      const nineCenter = calculate9CenterMap(primeStack);
      const role = calculateFractalRole(primeStack);
      const authority = calculateAuthorityNode(primeStack);
      const summary = generatePrimeStackSummary(primeStack);

      expect(primeStack.positions.length).toBe(9);
      expect(Object.keys(nineCenter).length).toBe(9);
      expect(role.role).toBeDefined();
      expect(authority.node).toBeDefined();
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
