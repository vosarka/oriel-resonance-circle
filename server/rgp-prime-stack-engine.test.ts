/**
 * RGP Prime Stack Engine Tests — VRC v1.0
 *
 * Tests the two-chart calculation system (Conscious + Design charts)
 * and the VRC Mandala-based codon assignment.
 */
import { describe, it, expect } from 'vitest';
import {
  calculatePrimeStack,
  calculate9CenterMap,
  calculateFractalRole,
  calculateAuthorityNode,
  validatePrimeStack,
  generatePrimeStackSummary,
} from './rgp-prime-stack-engine';

// ─── Sample charts ────────────────────────────────────────────────────────────

/** Conscious chart: planets at T_birth (all longitudes in degrees). */
const sampleConscious: Record<string, { longitude: number }> = {
  Sun:           { longitude: 45 },
  Moon:          { longitude: 135 },
  'North Node':  { longitude: 315 },
  Chiron:        { longitude: 90 },
};

/** Design chart: planets at T_design (88° Solar Arc offset). */
const sampleDesign: Record<string, { longitude: number }> = {
  Sun:           { longitude: ((45 - 88) + 360) % 360 },   // ≈ 317°
  Moon:          { longitude: ((135 - 88) + 360) % 360 },  // ≈ 47°
  'North Node':  { longitude: ((315 - 88) + 360) % 360 },  // ≈ 227°
};

describe('RGP Prime Stack Calculation Engine', () => {
  describe('Prime Stack Calculation', () => {
    it('should calculate Prime Stack from two charts', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(primeStack).toBeDefined();
      expect(primeStack.positions).toBeDefined();
    });

    it('should have 9 positions in Prime Stack', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(primeStack.positions.length).toBe(9);
    });

    it('should assign VRC format codon256 IDs (<codon>-<facet>)', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const position of primeStack.positions) {
        // VRC format: "38-A", legacy format: "RC38-A" — both accepted
        expect(position.codon256Id).toMatch(/^\d+-[ABCD]$/);
      }
    });

    it('should assign codon numbers between 1 and 64', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const position of primeStack.positions) {
        expect(position.codon).toBeGreaterThanOrEqual(1);
        expect(position.codon).toBeLessThanOrEqual(64);
      }
    });

    it('should label positions with source (conscious or design)', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const sources = primeStack.positions.map(p => p.source);
      expect(sources).toContain('conscious');
      expect(sources).toContain('design');
    });

    it('should calculate weighted frequencies (≥ 0)', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const position of primeStack.positions) {
        expect(position.weightedFrequency).toBeGreaterThanOrEqual(0);
      }
    });

    it('should identify dominant position (1–9)', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(primeStack.dominantPosition).toBeGreaterThanOrEqual(1);
      expect(primeStack.dominantPosition).toBeLessThanOrEqual(9);
    });

    it('should calculate total weight > 0', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(primeStack.totalWeight).toBeGreaterThan(0);
    });

    it('should map facets to A, B, C, or D', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const position of primeStack.positions) {
        expect(['A', 'B', 'C', 'D']).toContain(position.facet);
      }
    });

    it('should include VRC Type and Authority', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(['Reflector', 'Resonator', 'Catalyst', 'Harmonizer']).toContain(primeStack.vrcType);
      expect(primeStack.vrcAuthority).toBeDefined();
    });
  });

  describe('Circuit Links', () => {
    it('should calculate circuit links between positions', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(primeStack.circuitLinks).toBeDefined();
      expect(Array.isArray(primeStack.circuitLinks)).toBe(true);
    });

    it('should have valid link types', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const link of primeStack.circuitLinks) {
        expect(['harmonic', 'opposition', 'square', 'trine']).toContain(link.linkType);
      }
    });

    it('should have strength values 0–100', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      for (const link of primeStack.circuitLinks) {
        expect(link.strength).toBeGreaterThanOrEqual(0);
        expect(link.strength).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('9-Center Resonance Map', () => {
    it('should calculate 9-Center map', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const nineCenter = calculate9CenterMap(primeStack);
      expect(nineCenter).toBeDefined();
    });

    it('should have all 9 VRC centers', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const nineCenter = calculate9CenterMap(primeStack);
      expect(Object.keys(nineCenter).length).toBe(9);
    });

    it('should include valid VRC center names', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const nineCenter = calculate9CenterMap(primeStack);
      const validCenters = ['Crown','Ajna','Throat','G-Self','Heart','Solar Plexus','Sacral','Spleen','Root'];
      for (const [name] of Object.entries(nineCenter)) {
        expect(validCenters).toContain(name);
      }
    });

    it('should include defined/open status for each center', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const nineCenter = calculate9CenterMap(primeStack);
      for (const center of Object.values(nineCenter)) {
        expect(typeof center.defined).toBe('boolean');
      }
    });
  });

  describe('Fractal Role Calculation', () => {
    it('should calculate fractal role', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const role = calculateFractalRole(primeStack);
      expect(role.role).toBeDefined();
      expect(role.description).toBeDefined();
      expect(role.alignment).toBeDefined();
    });

    it('should identify valid VRC role types', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const role = calculateFractalRole(primeStack);
      expect(['Reflector', 'Resonator', 'Catalyst', 'Harmonizer']).toContain(role.role);
    });

    it('should calculate alignment percentage 0–100', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const role = calculateFractalRole(primeStack);
      expect(role.alignment).toBeGreaterThanOrEqual(0);
      expect(role.alignment).toBeLessThanOrEqual(100);
    });
  });

  describe('Authority Node Calculation', () => {
    it('should calculate authority node', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority.node).toBeDefined();
      expect(authority.position).toBeDefined();
      expect(authority.strength).toBeDefined();
    });

    it('should identify valid position (1–9)', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority.position).toBeGreaterThanOrEqual(1);
      expect(authority.position).toBeLessThanOrEqual(9);
    });

    it('should have non-negative strength', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const authority = calculateAuthorityNode(primeStack);
      expect(authority.strength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Validation', () => {
    it('should validate Prime Stack integrity', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const validation = validatePrimeStack(primeStack);
      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('should detect missing positions', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      primeStack.positions = primeStack.positions.slice(0, 5);
      const validation = validatePrimeStack(primeStack);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Prime Stack Summary', () => {
    it('should generate Prime Stack summary string', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const summary = generatePrimeStackSummary(primeStack);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should include all 9 position numbers in summary', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const summary = generatePrimeStackSummary(primeStack);
      for (let i = 1; i <= 9; i++) {
        expect(summary).toContain(`${i}.`);
      }
    });

    it('should include VRC Type in summary', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const summary = generatePrimeStackSummary(primeStack);
      expect(summary).toContain('VRC Type:');
    });

    it('should include Authority in summary', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
      const summary = generatePrimeStackSummary(primeStack);
      expect(summary).toContain('Authority:');
    });
  });

  describe('Integration Tests', () => {
    it('should handle different chart configurations', () => {
      const altConscious: Record<string, { longitude: number }> = {
        Sun:          { longitude: 0 },
        Moon:         { longitude: 90 },
        'North Node': { longitude: 270 },
        Chiron:       { longitude: 45 },
      };
      const altDesign: Record<string, { longitude: number }> = {
        Sun:          { longitude: (360 - 88) % 360 },
        Moon:         { longitude: (90 - 88 + 360) % 360 },
        'North Node': { longitude: (270 - 88 + 360) % 360 },
      };
      const primeStack = calculatePrimeStack(altConscious, altDesign);
      expect(primeStack.positions.length).toBe(9);
      expect(primeStack.dominantPosition).toBeGreaterThanOrEqual(1);
    });

    it('should return consistent results for identical inputs', () => {
      const ps1 = calculatePrimeStack(sampleConscious, sampleDesign);
      const ps2 = calculatePrimeStack(sampleConscious, sampleDesign);
      expect(ps1.dominantPosition).toBe(ps2.dominantPosition);
      expect(ps1.positions.length).toBe(ps2.positions.length);
      for (let i = 0; i < ps1.positions.length; i++) {
        expect(ps1.positions[i].codon256Id).toBe(ps2.positions[i].codon256Id);
      }
    });

    it('should generate complete diagnostic from Prime Stack', () => {
      const primeStack = calculatePrimeStack(sampleConscious, sampleDesign);
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
