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
      sun: 355,
      moon: 120,
      earth: 175, // Required for Design Sun
      nodes: 85,  // Required for Nodes position
      chiron: 135,
      mercury: 10,
      venus: 340,
      mars: 180,
      jupiter: 45,
      saturn: 210,
      uranus: 300,
      neptune: 270,
      pluto: 225,
      northNode: 85,
      southNode: 265,
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
      expect(reading.version).toBe(1);
    });

    it('should include Prime Stack with 9 positions', async () => {
      const reading = await generateStaticSignature('user-456', sampleBirthChart, 50);

      expect(reading.primeStack).toBeDefined();
      expect(reading.primeStack.length).toBe(9);
      expect(reading.primeStack[0].position).toBe(1);
      expect(reading.primeStack[8].position).toBe(9);
    });

    it('should include 9-Center Resonance Map', async () => {
      const reading = await generateStaticSignature('user-789', sampleBirthChart, 60);

      expect(reading.ninecenters).toBeDefined();
      expect(Object.keys(reading.ninecenters).length).toBeGreaterThan(0);
      for (const centerNum of Object.keys(reading.ninecenters)) {
        const center = reading.ninecenters[parseInt(centerNum)];
        expect(center.centerName).toBeDefined();
        expect(center.codon256Id).toBeDefined();
        expect(typeof center.frequency).toBe('number');
        expect(center.frequency).toBeGreaterThanOrEqual(0);
      }
    });

    it('should determine Fractal Role correctly', async () => {
      const reading = await generateStaticSignature('user-role', sampleBirthChart, 70);

      expect(reading.fractalRole).toBeDefined();
      const validRoles = ['Reflector', 'Resonator', 'Catalyst', 'Harmonizer'];
      expect(validRoles).toContain(reading.fractalRole);
    });

    it('should identify Authority Node', async () => {
      const reading = await generateStaticSignature('user-auth', sampleBirthChart, 55);

      expect(reading.authorityNode).toBeDefined();
      expect(reading.authorityNode).toMatch(/Authority|Node/);
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
      const lowCoherence = await generateStaticSignature('user-low', sampleBirthChart, 30);
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

    it('should reject missing sun position', () => {
      const invalid = { ...sampleBirthChart, sun: undefined };
      const result = validateBirthChartData(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Sun') || e.includes('sun'))).toBe(true);
    });

    it('should reject missing moon position', () => {
      const invalid = { ...sampleBirthChart, moon: undefined };
      const result = validateBirthChartData(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Moon') || e.includes('moon'))).toBe(true);
    });

    it('should reject invalid degree ranges', () => {
      const invalid = { ...sampleBirthChart, sun: 400 };
      const result = validateBirthChartData(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Sun') || e.includes('sun'))).toBe(true);
    });

    it('should reject negative degrees', () => {
      const invalid = { ...sampleBirthChart, moon: -45 };
      const result = validateBirthChartData(invalid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Moon') || e.includes('moon'))).toBe(true);
    });

    it('should accept optional planetary positions', () => {
      const minimal = {
        birthDate: new Date('1985-03-15'),
        sun: 355,
        moon: 120,
        earth: 175,
        nodes: 85,
      } as any;
      const result = validateBirthChartData(minimal);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('parseBirthTime', () => {
    it('should parse valid birth time', () => {
      const result = parseBirthTime('14:30');

      expect(result).toBe(14.5);
    });

    it('should parse midnight', () => {
      const result = parseBirthTime('00:00');

      expect(result).toBe(0);
    });

    it('should parse noon', () => {
      const result = parseBirthTime('12:00');

      expect(result).toBe(12);
    });

    it('should parse time with minutes', () => {
      const result = parseBirthTime('09:45');

      expect(result).toBe(9.75);
    });

    it('should handle 23:59', () => {
      const result = parseBirthTime('23:59');

      expect(result).toBeCloseTo(23.9833, 4);
    });
  });

  describe('calculateLocalSiderealTime', () => {
    it('should calculate LST for given birth data', () => {
      const birthDate = new Date('1985-03-15');
      const longitude = -74.0060; // New York
      const birthTime = 14.5; // 14:30

      const lst = calculateLocalSiderealTime(birthDate, longitude, birthTime);

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should handle positive longitude', () => {
      const birthDate = new Date('1985-03-15');
      const longitude = 139.6917; // Tokyo
      const birthTime = 10;

      const lst = calculateLocalSiderealTime(birthDate, longitude, birthTime);

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should handle negative longitude', () => {
      const birthDate = new Date('1985-03-15');
      const longitude = -74.0060; // New York
      const birthTime = 14.5;

      const lst = calculateLocalSiderealTime(birthDate, longitude, birthTime);

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });

    it('should wrap around 24 hours', () => {
      const birthDate = new Date('1985-03-15');
      const longitude = 180; // International Date Line
      const birthTime = 23;

      const lst = calculateLocalSiderealTime(birthDate, longitude, birthTime);

      expect(lst).toBeGreaterThanOrEqual(0);
      expect(lst).toBeLessThan(24);
    });
  });

  describe('calculateDesignOffset', () => {
    it('should calculate 88° solar-arc offset', () => {
      const sunPosition = 0;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe(88);
    });

    it('should handle sun in Aries', () => {
      const sunPosition = 15;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe(103);
    });

    it('should wrap around 360°', () => {
      const sunPosition = 300;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe(28);
    });

    it('should handle sun at 0°', () => {
      const sunPosition = 0;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe(88);
    });

    it('should handle sun at 360°', () => {
      const sunPosition = 360;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe(88 % 360);
    });

    it('should handle sun at 272°', () => {
      const sunPosition = 272;
      const offset = calculateDesignOffset(sunPosition);

      expect(offset).toBe((272 + 88) % 360);
    });
  });
});
