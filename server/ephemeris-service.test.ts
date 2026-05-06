import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import {
  calculateBirthChart,
  calculateBothCharts,
  getPlanetPosition,
  getAllPlanetPositions,
  formatPlanetPosition,
} from './ephemeris-service';
import { longitudeToCodonFacet } from './vrc-mandala';

type MockSwissResult = {
  longitude?: number;
  latitude?: number;
  distance?: number;
  longitudeSpeed?: number;
};

const SEFLG_SPEED = 256;

const mockLongitudes: Record<number, number> = {
  0: 280,
  1: 15,
  2: 40,
  3: 75,
  4: 110,
  5: 145,
  6: 180,
  7: 215,
  8: 250,
  9: 285,
  11: 90,
};

function mockResult(longitude: number): MockSwissResult {
  return {
    longitude,
    latitude: 0,
    distance: 1,
    longitudeSpeed: 1,
  };
}

async function importEphemerisWithMock(
  calc: (jd: number, planetId: number, flags?: number) => MockSwissResult
) {
  vi.resetModules();
  vi.doMock('swisseph-wasm', () => ({
    default: class MockSwissEph {
      async initSwissEph() {}
      julday() {
        return 1000;
      }
      calc(jd: number, planetId: number, flags: number) {
        return calc(jd, planetId, flags);
      }
    },
  }));
  return import('./ephemeris-service');
}

describe('Ephemeris Service', () => {
  // Test with a known birth date: 1990-01-01 12:00 UTC at Greenwich (0, 0)
  const testBirthDate = new Date('1990-01-01');
  const testBirthTime = '12:00:00';
  const testLatitude = 51.4769; // Greenwich
  const testLongitude = 0.0;
  const testTimezone = 0;

  let birthChart: any;

  beforeAll(async () => {
    birthChart = await calculateBirthChart(
      testBirthDate,
      testBirthTime,
      testLatitude,
      testLongitude,
      testTimezone
    );
  });

  describe('calculateBirthChart', () => {
    it('should calculate birth chart with valid data', async () => {
      expect(birthChart).toBeDefined();
      expect(birthChart.timestamp).toBeDefined();
      expect(birthChart.jd).toBeDefined();
      expect(birthChart.latitude).toBe(testLatitude);
      expect(birthChart.longitude).toBe(testLongitude);
      expect(birthChart.timezone).toBe(testTimezone);
    });

    it('should calculate planetary positions', async () => {
      expect(birthChart.planets).toBeDefined();
      expect(Object.keys(birthChart.planets).length).toBeGreaterThan(0);
    });

    it('should include Sun position', async () => {
      expect(birthChart.planets['Sun']).toBeDefined();
      const sun = birthChart.planets['Sun'];
      expect(sun.longitude).toBeGreaterThanOrEqual(0);
      expect(sun.longitude).toBeLessThan(360);
      expect(sun.zodiacSign).toBeDefined();
      expect(sun.zodiacDegree).toBeGreaterThanOrEqual(0);
      expect(sun.zodiacDegree).toBeLessThan(30);
    });

    it('should include Moon position', async () => {
      expect(birthChart.planets['Moon']).toBeDefined();
      const moon = birthChart.planets['Moon'];
      expect(moon.longitude).toBeGreaterThanOrEqual(0);
      expect(moon.longitude).toBeLessThan(360);
      expect(moon.zodiacSign).toBeDefined();
    });

    it('should include all major planets', async () => {
      const expectedPlanets = [
        'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
        'Saturn', 'Uranus', 'Neptune', 'Pluto', 'North Node', 'South Node', 'Earth'
      ];
      
      for (const planet of expectedPlanets) {
        expect(birthChart.planets[planet]).toBeDefined();
      }
    });

    it('should expose the canonical 13 activations for one chart layer', async () => {
      expect(Object.keys(birthChart.planets)).toHaveLength(13);
    });

    it('matches the VRC validation vector for 2024-01-01 12:00 UTC', async () => {
      const { conscious, design } = await calculateBothCharts(
        new Date('2024-01-01'),
        '12:00:00',
        0,
        0,
        0
      );

      const consciousSun = conscious.planets['Sun'].longitude;
      const designSun = design.planets['Sun'].longitude;
      const solarArc = ((consciousSun - designSun) % 360 + 360) % 360;

      expect(consciousSun).toBeCloseTo(280.46, 1);
      expect(longitudeToCodonFacet(consciousSun).codon).toBe(38);
      expect(designSun).toBeCloseTo(192.46, 1);
      expect(longitudeToCodonFacet(designSun).codon).toBe(57);
      expect(solarArc).toBeCloseTo(88, 3);
      expect(Object.keys(conscious.planets)).toHaveLength(13);
      expect(Object.keys(design.planets)).toHaveLength(13);
    });

    it('should calculate house system', async () => {
      // VRC § 1: House System = None / Equal — the VRC uses the Mandala (360°), not House cusps.
      expect(birthChart.houses).toBeDefined();
      expect(birthChart.houses.system).toBe('None');
      expect(birthChart.houses.houses.length).toBe(12);
      expect(birthChart.houses.ascendant).toBeDefined();
      expect(birthChart.houses.midheaven).toBeDefined();
    });

    it('should have valid zodiac signs', async () => {
      const validSigns = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];
      
      for (const planet of Object.values(birthChart.planets)) {
        expect(validSigns).toContain((planet as any).zodiacSign);
      }
    });

    it('should calculate with different timezone', async () => {
      const chart = await calculateBirthChart(
        testBirthDate,
        '12:00:00',
        testLatitude,
        testLongitude,
        -5 // EST
      );
      
      expect(chart).toBeDefined();
      expect(chart.timezone).toBe(-5);
      // The positions should be different due to timezone offset
      expect(chart.planets['Sun']).toBeDefined();
    });

    it('should calculate with different location', async () => {
      const chart = await calculateBirthChart(
        testBirthDate,
        '12:00:00',
        40.7128, // New York latitude
        -74.0060, // New York longitude
        -5 // EST
      );
      
      expect(chart).toBeDefined();
      expect(chart.latitude).toBe(40.7128);
      expect(chart.longitude).toBe(-74.0060);
    });
  });

  describe('getPlanetPosition', () => {
    it('should get Sun position', () => {
      const sun = getPlanetPosition(birthChart, 'Sun');
      expect(sun).toBeDefined();
      expect(sun?.planet).toBe('Sun');
      expect(sun?.longitude).toBeGreaterThanOrEqual(0);
      expect(sun?.longitude).toBeLessThan(360);
    });

    it('should get Moon position', () => {
      const moon = getPlanetPosition(birthChart, 'Moon');
      expect(moon).toBeDefined();
      expect(moon?.planet).toBe('Moon');
    });

    it('should return undefined for non-existent planet', () => {
      const planet = getPlanetPosition(birthChart, 'NonExistent');
      expect(planet).toBeUndefined();
    });
  });

  describe('getAllPlanetPositions', () => {
    it('should return all planetary positions', () => {
      const positions = getAllPlanetPositions(birthChart);
      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every((p) => p.planet && p.longitude !== undefined)).toBe(true);
    });

    it('should return array of PlanetaryPosition objects', () => {
      const positions = getAllPlanetPositions(birthChart);
      positions.forEach((position) => {
        expect(position.planet).toBeDefined();
        expect(position.planetId).toBeDefined();
        expect(position.longitude).toBeDefined();
        expect(position.latitude).toBeDefined();
        expect(position.distance).toBeDefined();
        expect(position.speed).toBeDefined();
        expect(position.zodiacSign).toBeDefined();
        expect(position.zodiacDegree).toBeDefined();
      });
    });
  });

  describe('formatPlanetPosition', () => {
    it('should format planet position as string', () => {
      const sun = getPlanetPosition(birthChart, 'Sun');
      if (sun) {
        const formatted = formatPlanetPosition(sun);
        expect(formatted).toContain('Sun');
        expect(formatted).toContain('°');
        expect(formatted).toContain(sun.zodiacSign);
      }
    });

    it('should include zodiac degree in formatted string', () => {
      const moon = getPlanetPosition(birthChart, 'Moon');
      if (moon) {
        const formatted = formatPlanetPosition(moon);
        expect(formatted).toContain(moon.zodiacDegree.toFixed(1));
      }
    });
  });

  describe('Ephemeris Accuracy', () => {
    it('should calculate consistent positions for same input', async () => {
      const chart1 = await calculateBirthChart(
        testBirthDate,
        testBirthTime,
        testLatitude,
        testLongitude,
        testTimezone
      );
      
      const chart2 = await calculateBirthChart(
        testBirthDate,
        testBirthTime,
        testLatitude,
        testLongitude,
        testTimezone
      );
      
      expect(chart1.planets['Sun'].longitude).toBe(chart2.planets['Sun'].longitude);
      expect(chart1.planets['Moon'].longitude).toBe(chart2.planets['Moon'].longitude);
    });

    it('should have reasonable planetary positions', async () => {
      // All planets should have longitude between 0 and 360
      for (const planet of Object.values(birthChart.planets)) {
        expect((planet as any).longitude).toBeGreaterThanOrEqual(0);
        expect((planet as any).longitude).toBeLessThan(360);
        // Latitude should be reasonable (usually between -30 and 30 for planets)
        expect((planet as any).latitude).toBeGreaterThan(-90);
        expect((planet as any).latitude).toBeLessThan(90);
        // Distance should be reasonable (1-6 AU for most planets)
        expect((planet as any).distance).toBeGreaterThan(0);
        expect((planet as any).distance).toBeLessThan(50);
      }
    });
  });
});

describe('Ephemeris fail-fast behavior', () => {
  afterEach(() => {
    vi.doUnmock('swisseph-wasm');
    vi.resetModules();
  });

  it('rejects calculateBirthChart when one required Swiss body fails', async () => {
    const service = await importEphemerisWithMock((_jd, planetId) => {
      if (planetId === 8) throw new Error('Neptune unavailable');
      return mockResult(mockLongitudes[planetId] ?? 0);
    });

    await expect(
      service.calculateBirthChart(new Date('1990-01-01'), '12:00:00', 0, 0, 0)
    ).rejects.toThrow(/Failed to calculate birth chart: .*Neptune unavailable/);
  });

  it('rejects calculateBothCharts when conscious Sun is non-finite', async () => {
    const service = await importEphemerisWithMock((_jd, planetId) => {
      if (planetId === 0) return mockResult(Number.NaN);
      return mockResult(mockLongitudes[planetId] ?? 0);
    });

    await expect(
      service.calculateBothCharts(new Date('1990-01-01'), '12:00:00', 0, 0, 0)
    ).rejects.toThrow(/Sun: missing or non-finite longitude/);
  });

  it('rejects calculateBothCharts when the design chart is incomplete', async () => {
    const service = await importEphemerisWithMock((jd, planetId) => {
      if (planetId === 0) return mockResult(jd === 1000 ? 280 : 192);
      if (planetId === 1 && jd !== 1000) throw new Error('Design Moon unavailable');
      return mockResult(mockLongitudes[planetId] ?? 0);
    });

    await expect(
      service.calculateBothCharts(new Date('1990-01-01'), '12:00:00', 0, 0, 0)
    ).rejects.toThrow(/Design Moon unavailable/);
  });

  it('rejects design timing failure instead of producing a zero-default design chart', async () => {
    const service = await importEphemerisWithMock((jd, planetId) => {
      if (planetId === 0) {
        return mockResult(jd === 1000 ? 280 : Number.NaN);
      }
      return mockResult(mockLongitudes[planetId] ?? 0);
    });

    await expect(
      service.calculateBothCharts(new Date('1990-01-01'), '12:00:00', 0, 0, 0)
    ).rejects.toThrow(/Design solar-arc search failed/);
  });

  it('requests Swiss speed data for the design solar-arc search', async () => {
    const service = await importEphemerisWithMock((jd, planetId, flags = 0) => {
      const longitude = planetId === 0
        ? jd === 1000
          ? 280
          : 192
        : mockLongitudes[planetId] ?? 0;

      return {
        ...mockResult(longitude),
        longitudeSpeed: flags & SEFLG_SPEED ? 1 : 0,
      };
    });

    await expect(
      service.calculateBothCharts(new Date('1990-01-01'), '12:00:00', 0, 0, 0)
    ).resolves.toBeDefined();
  });
});
