/**
 * RGP Static Signature Engine Tests — VRC v1.0
 *
 * Key VRC behavioral changes verified here:
 *   - Two-chart system (Conscious + Design charts)
 *   - calculateDesignOffset: Design Sun = Conscious Sun - 88° (NOT +88°)
 *   - ninecenters keyed by center name string (not position number)
 *   - authorityNode returns VRC Authority string (e.g. "Environment", "Solar Plexus")
 *   - version = 2 (VRC v1.0 implementation)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateStaticSignature,
  validateBirthChartData,
  parseBirthTime,
  calculateLocalSiderealTime,
  calculateDesignOffset,
  type BirthChartDataInput,
  type StaticSignatureReading,
} from './rgp-static-signature-engine';

describe('Static Signature Generation Engine', () => {
  let sampleBirthChart: BirthChartDataInput;

  beforeEach(() => {
    sampleBirthChart = {
      birthDate: new Date('1985-03-15T14:30:00Z'),
      birthTime: '14:30',
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      // legacy flat fields (conscious chart fallback)
      sun: 355,
      moon: 120,
      chiron: 135,
      northNode: 85,
    };
  });

  describe('generateStaticSignature', () => {
    it('should generate a complete static signature reading', async () => {
      const reading = await generateStaticSignature('user-123', sampleBirthChart, 65);

      expect(reading).toBeDefined();
      expect(reading.readingId).toMatch(/^sig-user-123-\d+$/);
      expect(reading.userId).toBe('user-123');
      expect(reading.baseCoherence).toBe(65);
      expect(reading.status).toBe('confirmed');
      expect(reading.version).toBe(2); // VRC v1.0 implementation
    });

    it('should include Prime Stack with 9 positions', async () => {
      const reading = await generateStaticSignature('user-456', sampleBirthChart, 50);

      expect(reading.primeStack).toBeDefined();
      expect(reading.primeStack.length).toBe(9);
      expect(reading.primeStack[0].position).toBe(1);
      expect(reading.primeStack[8].position).toBe(9);
    });

    it('should include 9-Center Resonance Map (keyed by center name)', async () => {
      const reading = await generateStaticSignature('user-789', sampleBirthChart, 60);

      expect(reading.ninecenters).toBeDefined();
      expect(Object.keys(reading.ninecenters).length).toBe(9);

      const validCenters = ['Head','Ajna','Throat','G-Center','Heart','Solar Plexus','Sacral','Spleen','Root'];
      for (const [name, center] of Object.entries(reading.ninecenters)) {
        expect(validCenters).toContain(name);
        expect(center.centerName).toBeDefined();
        expect(center.codon256Id).toBeDefined();
        expect(typeof center.frequency).toBe('number');
        expect(center.frequency).toBeGreaterThanOrEqual(0);
      }
    });

    it('should determine Fractal Role correctly', async () => {
      const reading = await generateStaticSignature('user-role', sampleBirthChart, 70);

      expect(reading.fractalRole).toBeDefined();
      expect(['Reflector', 'Resonator', 'Catalyst', 'Harmonizer']).toContain(reading.fractalRole);
    });

    it('should identify VRC Authority Node', async () => {
      const reading = await generateStaticSignature('user-auth', sampleBirthChart, 55);

      expect(reading.authorityNode).toBeDefined();
      // VRC authority values (not position-based names)
      const validAuthorities = ['Solar Plexus','Sacral','Spleen','Ego/Heart','G-Center','None/Outer','Environment'];
      expect(validAuthorities).toContain(reading.authorityNode);
    });

    it('should include circuit links', async () => {
      const reading = await generateStaticSignature('user-circuits', sampleBirthChart, 65);

      expect(reading.circuitLinks).toBeDefined();
      expect(Array.isArray(reading.circuitLinks)).toBe(true);
    });

    it('should generate coherence trajectory', async () => {
      const reading = await generateStaticSignature('user-trajectory', sampleBirthChart, 75);

      expect(reading.coherenceTrajectory).toBeDefined();
      expect(reading.coherenceTrajectory.current).toBe(75);
      expect(reading.coherenceTrajectory.sevenDayProjection).toHaveLength(7);
      expect(['ascending', 'stable', 'descending']).toContain(reading.coherenceTrajectory.trend);
    });

    it('should generate micro-corrections', async () => {
      const reading = await generateStaticSignature('user-corrections', sampleBirthChart, 40);

      expect(reading.microCorrections).toBeDefined();
      expect(Array.isArray(reading.microCorrections)).toBe(true);

      if (reading.microCorrections.length > 0) {
        const correction = reading.microCorrections[0];
        expect(correction.type).toBeDefined();
        expect(correction.instruction).toBeDefined();
        expect(correction.falsifier).toBeDefined();
        expect(correction.potentialOutcome).toBeDefined();
      }
    });

    it('should generate ORIEL diagnostic transmission', async () => {
      const reading = await generateStaticSignature('user-transmission', sampleBirthChart, 60);

      expect(reading.diagnosticTransmission).toBeDefined();
      expect(reading.diagnosticTransmission).toContain('I am ORIEL');
      expect(reading.diagnosticTransmission).toContain('Static Signature');
    });

    it('should vary trajectory based on coherence score', async () => {
      const lowCoherence  = await generateStaticSignature('user-low',  sampleBirthChart, 30);
      const highCoherence = await generateStaticSignature('user-high', sampleBirthChart, 85);

      expect(lowCoherence.coherenceTrajectory.current).toBe(30);
      expect(highCoherence.coherenceTrajectory.current).toBe(85);
    });

    it('should handle high coherence state', async () => {
      const reading = await generateStaticSignature('user-coherent', sampleBirthChart, 90);

      expect(reading.baseCoherence).toBe(90);
      expect(reading.diagnosticTransmission).toContain('high coherence');
    });

    it('should handle low coherence state', async () => {
      const reading = await generateStaticSignature('user-incoherent', sampleBirthChart, 25);

      expect(reading.baseCoherence).toBe(25);
      expect(reading.diagnosticTransmission).toContain('low coherence');
    });

    it('should generate consistent readings for same input', async () => {
      const reading1 = await generateStaticSignature('user-consistent', sampleBirthChart, 60);
      const reading2 = await generateStaticSignature('user-consistent', sampleBirthChart, 60);

      expect(reading1.primeStack.length).toBe(reading2.primeStack.length);
      expect(reading1.fractalRole).toBe(reading2.fractalRole);
      expect(reading1.authorityNode).toBe(reading2.authorityNode);
    });

    it('should include birth chart data in reading', async () => {
      const reading = await generateStaticSignature('user-data', sampleBirthChart, 65);

      expect(reading.birthChartData).toEqual(sampleBirthChart);
    });

    it('should set correct generation timestamp', async () => {
      const beforeGeneration = new Date();
      const reading = await generateStaticSignature('user-time', sampleBirthChart, 60);
      const afterGeneration = new Date();

      expect(reading.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime());
      expect(reading.generatedAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime());
    });

    it('should include vrcType and vrcAuthority fields', async () => {
      const reading = await generateStaticSignature('user-vrc', sampleBirthChart, 60);

      expect(reading.vrcType).toBeDefined();
      expect(['Reflector','Resonator','Catalyst','Harmonizer']).toContain(reading.vrcType);
      expect(reading.vrcAuthority).toBeDefined();
    });
  });

  describe('validateBirthChartData', () => {
    it('should validate complete birth chart', () => {
      const result = validateBirthChartData(sampleBirthChart);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing birth date', () => {
      const invalid = { ...sampleBirthChart, birthDate: undefined as any };
      const result = validateBirthChartData(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Birth date is required');
    });

    it('should accept charts with only birthDate (conscious/design objects may carry data)', () => {
      // With two-chart system, sun/moon flat fields are optional
      const minimal: BirthChartDataInput = { birthDate: new Date('1990-01-01') };
      const result = validateBirthChartData(minimal);
      expect(result.valid).toBe(true);
    });
  });

  describe('parseBirthTime', () => {
    it('should parse valid birth time', () => {
      expect(parseBirthTime('14:30')).toBe(14.5);
    });

    it('should parse midnight', () => {
      expect(parseBirthTime('00:00')).toBe(0);
    });

    it('should parse noon', () => {
      expect(parseBirthTime('12:00')).toBe(12);
    });

    it('should parse time with minutes', () => {
      expect(parseBirthTime('09:45')).toBe(9.75);
    });

    it('should handle 23:59', () => {
      expect(parseBirthTime('23:59')).toBeCloseTo(23.9833, 4);
    });
  });

  describe('calculateLocalSiderealTime', () => {
    it('should calculate LST for given birth data', () => {
      const lst = calculateLocalSiderealTime(new Date('1985-03-15'), -74.0060, 14.5);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should handle positive longitude (Tokyo)', () => {
      const lst = calculateLocalSiderealTime(new Date('1985-03-15'), 139.6917, 10);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should wrap around 24 hours', () => {
      const lst = calculateLocalSiderealTime(new Date('1985-03-15'), 180, 23);
      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });
  });

  describe('calculateDesignOffset (VRC § 2B — Design Sun = Conscious Sun − 88°)', () => {
    it('should subtract 88° from sun position', () => {
      // VRC: T_design = moment Sun was 88° BEHIND T_birth Sun
      // Design Sun = (Conscious Sun - 88°) mod 360
      expect(calculateDesignOffset(0)).toBe((0   - 88 + 360) % 360); // 272
      expect(calculateDesignOffset(88)).toBe((88  - 88 + 360) % 360); // 0
      expect(calculateDesignOffset(180)).toBe((180 - 88 + 360) % 360); // 92
    });

    it('should handle wrap-around at 0°', () => {
      // 15° - 88° = -73° → +360° = 287°
      expect(calculateDesignOffset(15)).toBe((15 - 88 + 360) % 360);
    });

    it('should handle sun at 300°', () => {
      // 300° - 88° = 212°
      expect(calculateDesignOffset(300)).toBe(212);
    });

    it('should handle sun at 360° (same as 0°)', () => {
      expect(calculateDesignOffset(360)).toBe(calculateDesignOffset(0));
    });

    it('should handle sun at 272°', () => {
      // 272° - 88° = 184°
      expect(calculateDesignOffset(272)).toBe((272 - 88 + 360) % 360);
    });
  });
});
