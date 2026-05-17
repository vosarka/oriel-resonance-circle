import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  calculateBothCharts: vi.fn(),
}));

vi.mock('./ephemeris-service', () => ({
  calculateBothCharts: mocks.calculateBothCharts,
}));

import { buildUserStaticProfile, summarizeStoredStaticProfile } from './static-profile-service';

const completePlanets = {
  Sun: { longitude: 280 },
  Moon: { longitude: 15 },
  Mercury: { longitude: 40 },
  Venus: { longitude: 75 },
  Mars: { longitude: 110 },
  Jupiter: { longitude: 145 },
  Saturn: { longitude: 180 },
  Uranus: { longitude: 215 },
  Neptune: { longitude: 250 },
  Pluto: { longitude: 285 },
  'North Node': { longitude: 90 },
  'South Node': { longitude: 270 },
  Earth: { longitude: 100 },
};

function chartWith(planets: typeof completePlanets, jd: number) {
  return {
    jd,
    planets: Object.fromEntries(
      Object.entries(planets).map(([planet, position]) => [
        planet,
        {
          planet,
          planetId: 0,
          longitude: position.longitude,
          latitude: 0,
          distance: 1,
          speed: 1,
          zodiacSign: 'Aries',
          zodiacDegree: 0,
        },
      ]),
    ),
  };
}

describe('buildUserStaticProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses an exact static profile when birth time is missing before ephemeris runs', async () => {
    await expect(buildUserStaticProfile('1', {
      birthDate: '1985-03-15',
      birthTime: '',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneOffset: -5,
    })).rejects.toThrow(/birth time is required/i);

    expect(mocks.calculateBothCharts).not.toHaveBeenCalled();
  });

  it('does not produce a static profile when exact ephemeris calculation fails', async () => {
    mocks.calculateBothCharts.mockRejectedValueOnce(new Error('ephemeris unavailable'));

    await expect(buildUserStaticProfile('1', {
      birthDate: '1985-03-15',
      birthTime: '14:30',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneOffset: -5,
    })).rejects.toThrow('ephemeris unavailable');
  });

  it('carries canonical activations and channel statuses into the stored profile payload', async () => {
    mocks.calculateBothCharts.mockResolvedValueOnce({
      conscious: chartWith(completePlanets, 1),
      design: chartWith(
        Object.fromEntries(
          Object.entries(completePlanets).map(([planet, position]) => [
            planet,
            { longitude: (position.longitude + 272) % 360 },
          ]),
        ) as typeof completePlanets,
        2,
      ),
    });

    const profile = await buildUserStaticProfile('1', {
      birthDate: '1985-03-15',
      birthTime: ' 14:30 ',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneId: 'America/New_York',
      timezoneOffset: -5,
    });

    expect(mocks.calculateBothCharts).toHaveBeenCalledWith(
      expect.any(Date),
      '14:30',
      40.7128,
      -74.006,
      -5,
    );
    expect(profile.calculationContext).toMatchObject({
      status: 'exact',
      birthDate: '1985-03-15',
      birthTime: '14:30',
      birthPlace: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      resolvedTimezoneId: 'America/New_York',
      timezoneOffsetHours: -5,
    });
    expect(profile.activations).toHaveLength(26);
    expect(profile.channelStatuses).toHaveLength(36);
    expect(profile.legacyCircuitLinks).toEqual(profile.circuitLinks);
    expect((profile.coreCodonEngine as Record<string, any>).lattice.activations).toHaveLength(26);
  });

  it('summarizes real active resonance links separately from legacy position links', () => {
    const summary = summarizeStoredStaticProfile({
      birthDate: '1985-03-15',
      birthTime: '14:30',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneId: 'America/New_York',
      timezoneOffset: -5,
      calculationStatus: 'exact',
      calculationContext: {
        status: 'exact',
        birthDate: '1985-03-15',
        birthTime: '14:30',
        birthPlace: 'New York',
        birthCountry: 'US',
        latitude: 40.7128,
        longitude: -74.006,
        resolvedTimezoneId: 'America/New_York',
        timezoneOffsetHours: -5,
        missingPrecision: [],
      },
      channelStatuses: [
        { gateA: 25, gateB: 51, active: true, centerA: 'G-Self', centerB: 'Heart' },
      ],
      legacyCircuitLinks: ['1-2'],
      primeStack: [],
      ninecenters: {},
    });

    expect(summary).toContain('ACTIVE RESONANCE LINKS:');
    expect(summary).toContain('Codon 25-Codon 51');
    expect(summary).toContain('CALCULATION TRUST CONTRACT:');
    expect(summary).toContain('Status: exact');
    expect(summary).toContain('Birth data: 1985-03-15 14:30, New York, US');
    expect(summary).toContain('Coordinates: 40.7128, -74.006');
    expect(summary).toContain('Resolved timezone: America/New_York (UTC-5)');
    expect(summary).not.toMatch(/\bchannels?\b/i);
    expect(summary).not.toMatch(/\bgates?\b/i);
    expect(summary).toContain('LEGACY POSITION LINKS: ["1-2"]');
  });

  it('does not infer exact precision for legacy profiles without a stored calculation context', () => {
    const summary = summarizeStoredStaticProfile({
      birthDate: '1985-03-15',
      birthTime: '14:30',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneId: 'America/New_York',
      timezoneOffset: -5,
      calculationStatus: 'fallback',
      primeStack: [],
      ninecenters: {},
    });

    expect(summary).toContain('CALCULATION TRUST CONTRACT:');
    expect(summary).toContain('Status: missing_precision');
    expect(summary).toContain('Missing precision: calculation context, exact calculation status');
    expect(summary).not.toContain('Status: exact');
  });

  it('downgrades malformed stored calculation contexts instead of trusting false exact status', () => {
    const summary = summarizeStoredStaticProfile({
      birthDate: '1985-03-15',
      birthTime: '14:30',
      birthCity: 'New York',
      birthCountry: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      timezoneId: 'America/New_York',
      timezoneOffset: -5,
      calculationStatus: 'exact',
      calculationContext: {
        status: 'exact',
        birthDate: '1985-03-15',
        birthTime: null,
        birthPlace: 'New York',
        birthCountry: 'US',
        latitude: null,
        longitude: null,
        resolvedTimezoneId: 'America/New_York',
        timezoneOffsetHours: null,
        missingPrecision: [],
      },
      primeStack: [],
      ninecenters: {},
    });

    expect(summary).toContain('Status: missing_precision');
    expect(summary).toContain('Birth data: 1985-03-15 missing time, New York, US');
    expect(summary).toContain('Missing precision: birth time, birth coordinates, timezone offset');
  });

  it('renders nullable legacy birth times as missing instead of literal null', () => {
    const summary = summarizeStoredStaticProfile({
      birthDate: '1985-03-15',
      birthTime: null,
      birthCity: 'New York',
      birthCountry: 'US',
      calculationStatus: 'fallback',
      primeStack: [],
      ninecenters: {},
    });

    expect(summary).toContain('Birth: 1985-03-15 at missing time in New York, US');
    expect(summary).not.toContain('at null');
  });
});
