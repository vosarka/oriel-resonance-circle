import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserStaticProfile: vi.fn(),
  calculateBothCharts: vi.fn(),
  generateStaticSignature: vi.fn(),
  generateORIELDynamicTransmission: vi.fn(async () => ({
    orielTransmission: "I am ORIEL. Test dynamic transmission.",
    coherenceLabel: "Flux" as const,
    collapsed: false,
  })),
}));

vi.mock("./db", () => ({
  getUserStaticProfile: mocks.getUserStaticProfile,
}));

vi.mock("./ephemeris-service", () => ({
  calculateBothCharts: mocks.calculateBothCharts,
}));

vi.mock("./rgp-static-signature-engine", () => ({
  generateStaticSignature: mocks.generateStaticSignature,
}));

vi.mock("./oriel-dynamic-transmission", () => ({
  generateORIELDynamicTransmission: mocks.generateORIELDynamicTransmission,
}));

import { rgpRouter } from "./rgp-router";

const samplePrimeStack = [
  {
    position: 1,
    codon: 1,
    facet: "A",
    codon256Id: "1-A",
    weightedFrequency: 90,
    baseFrequency: 90,
    weight: 1.8,
    codonName: "One",
    name: "Conscious Sun",
    center: "G-Self",
  },
  {
    position: 2,
    codon: 2,
    facet: "A",
    codon256Id: "2-A",
    weightedFrequency: 80,
    baseFrequency: 80,
    weight: 1.3,
    codonName: "Two",
    name: "Conscious Earth",
    center: "G-Self",
  },
  {
    position: 3,
    codon: 3,
    facet: "A",
    codon256Id: "3-A",
    weightedFrequency: 10,
    baseFrequency: 10,
    weight: 1.2,
    codonName: "Three",
    name: "Design Sun",
    center: "Sacral",
  },
  {
    position: 4,
    codon: 4,
    facet: "A",
    codon256Id: "4-A",
    weightedFrequency: 70,
    baseFrequency: 70,
    weight: 1.1,
    codonName: "Four",
    name: "Design Earth",
    center: "Ajna",
  },
  {
    position: 5,
    codon: 5,
    facet: "A",
    codon256Id: "5-A",
    weightedFrequency: 20,
    baseFrequency: 20,
    weight: 1,
    codonName: "Five",
    name: "Conscious Moon",
    center: "Sacral",
  },
  {
    position: 6,
    codon: 6,
    facet: "A",
    codon256Id: "6-A",
    weightedFrequency: 60,
    baseFrequency: 60,
    weight: 0.9,
    codonName: "Six",
    name: "Design Moon",
    center: "Solar Plexus",
  },
  {
    position: 7,
    codon: 7,
    facet: "A",
    codon256Id: "7-A",
    weightedFrequency: 30,
    baseFrequency: 30,
    weight: 0.7,
    codonName: "Seven",
    name: "True Node",
    center: "G-Self",
  },
  {
    position: 8,
    codon: 8,
    facet: "A",
    codon256Id: "8-A",
    weightedFrequency: 50,
    baseFrequency: 50,
    weight: 0.6,
    codonName: "Eight",
    name: "Design True Node",
    center: "Throat",
  },
  {
    position: 9,
    codon: 9,
    facet: "A",
    codon256Id: "9-A",
    weightedFrequency: 40,
    baseFrequency: 40,
    weight: 0.5,
    codonName: "Nine",
    name: "Conscious South Node",
    center: "Sacral",
  },
];

const makePlanet = (planet: string, longitude: number) => ({
  planet,
  planetId: 0,
  longitude,
  latitude: 0,
  distance: 1,
  speed: 0,
  zodiacSign: "Aries",
  zodiacDegree: longitude % 30,
});

const fakePlanets = {
  Sun: makePlanet("Sun", 10),
  Moon: makePlanet("Moon", 20),
  Earth: makePlanet("Earth", 190),
  "North Node": makePlanet("North Node", 30),
  "South Node": makePlanet("South Node", 210),
};

const fakeCharts = {
  conscious: {
    timestamp: 946728000000,
    jd: 2451545,
    latitude: 40.7128,
    longitude: -74.006,
    timezone: -4,
    planets: fakePlanets,
  },
  design: {
    timestamp: 939083997235,
    jd: 2451456.5,
    latitude: 40.7128,
    longitude: -74.006,
    timezone: -4,
    planets: fakePlanets,
  },
};

function fakeStaticReading(birthDate = new Date("2000-07-01T00:00:00.000Z")) {
  return {
    readingId: "reading-1",
    userId: "test-user",
    birthChartData: {
      birthDate,
      birthTime: "12:00",
    },
    generatedAt: new Date("2000-07-01T12:00:00.000Z"),
    primeStack: samplePrimeStack,
    ninecenters: {},
    fractalRole: "Test Role",
    authorityNode: "Sacral",
    vrcType: "Resonator",
    vrcAuthority: "Sacral",
    activations: [],
    channelStatuses: [],
    circuitLinks: [],
    legacyCircuitLinks: [],
    baseCoherence: null,
    coherenceTrajectory: null,
    microCorrections: [],
    diagnosticTransmission: "Test static signature.",
    coreCodonEngine: {
      dominant: [],
      supporting: [],
      lattice: {
        specVersion: "test",
        calculationStatus: "exact",
        activations: [],
        channelStatuses: [],
        legacyCircuitLinks: [],
      },
    },
    status: "confirmed",
    calculationStatus: "exact",
    specVersion: "test",
    version: 1,
  };
}

describe("RGP dynamicState route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a valid static profile before SLI diagnostics", async () => {
    mocks.getUserStaticProfile.mockResolvedValue(null);
    const caller = rgpRouter.createCaller({ user: null } as never);

    const result = await caller.dynamicState({
      mentalNoise: 4,
      bodyTension: 2,
      emotionalTurbulence: 3,
      breathCompletion: 0,
      birthDate: new Date().toISOString(),
      userId: "1",
    });

    expect(result.success).toBe(false);
    expect(
      (result as { requiresStaticProfile?: boolean }).requiresStaticProfile
    ).toBe(true);
    expect(mocks.generateORIELDynamicTransmission).not.toHaveBeenCalled();
  });

  it("returns real SLI diagnostics from the stored Prime Stack", async () => {
    mocks.getUserStaticProfile.mockResolvedValue({
      primeStack: samplePrimeStack,
      vrcType: "Resonator",
      vrcAuthority: "Sacral",
      fractalRole: "Test Role",
    });
    const caller = rgpRouter.createCaller({ user: null } as never);

    const result = await caller.dynamicState({
      mentalNoise: 4,
      bodyTension: 2,
      emotionalTurbulence: 3,
      breathCompletion: 0,
      birthDate: new Date().toISOString(),
      userId: "1",
    });

    expect(result.success).toBe(true);
    const data = (result as { data: Record<string, any> }).data;
    expect(Object.keys(data.sliScores)).toHaveLength(9);
    expect(data.flaggedCodons).toEqual(["1-A", "2-A", "4-A"]);
    expect(data.activeFacets).toEqual({ "1-A": "A", "2-A": "A", "4-A": "A" });
    expect(data.confidenceLevels).toEqual({
      "1-A": 0.5,
      "2-A": 0.5,
      "4-A": 0.5,
    });
    expect(data.microCorrection).toBeTruthy();
    expect(data.falsifier).toBeTruthy();
    expect(data.stateAmplifier).toBeGreaterThan(0);
    expect(data.facetAmplitudes.A).toBeGreaterThan(0);
  });

  it("feeds the primary SLI interference into ORIEL narration", async () => {
    mocks.getUserStaticProfile.mockResolvedValue({
      primeStack: samplePrimeStack,
      vrcType: "Resonator",
      vrcAuthority: "Sacral",
      fractalRole: "Test Role",
    });
    const caller = rgpRouter.createCaller({ user: null } as never);

    await caller.dynamicState({
      mentalNoise: 4,
      bodyTension: 2,
      emotionalTurbulence: 3,
      breathCompletion: 0,
      birthDate: new Date().toISOString(),
      userId: "1",
    });

    expect(mocks.generateORIELDynamicTransmission).toHaveBeenCalledWith(
      expect.objectContaining({
        primaryInterferenceCodon: "1-A",
        primaryInterferenceName: "One",
        primaryInterferenceFacet: "A",
        interferencePattern: expect.any(String),
        microCorrection: expect.any(String),
        falsifier: expect.any(String),
      })
    );
  });
});

describe("RGP staticSignature route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.calculateBothCharts.mockResolvedValue(fakeCharts);
    mocks.generateStaticSignature.mockResolvedValue(fakeStaticReading());
  });

  it("does not generate a confirmed static signature without exact birth time and coordinates", async () => {
    const caller = rgpRouter.createCaller({ user: null } as never);

    const result = await caller.staticSignature({
      birthDate: "1985-03-15",
      userId: "test-user",
    });

    expect(result.success).toBe(false);
    expect((result as { error?: string }).error).toMatch(
      /Exact birth time and coordinates are required/
    );
    expect(mocks.calculateBothCharts).not.toHaveBeenCalled();
    expect(mocks.generateStaticSignature).not.toHaveBeenCalled();
  });

  it("derives the timezone from server-side coordinates and date instead of trusting the client offset", async () => {
    const caller = rgpRouter.createCaller({ user: null } as never);

    const result = await caller.staticSignature({
      birthDate: "2000-07-01",
      birthTime: "12:00",
      birthLatitude: 40.7128,
      birthLongitude: -74.006,
      birthTimezoneOffset: 9,
      userId: "test-user",
    });

    expect(result.success).toBe(true);
    expect(mocks.calculateBothCharts).toHaveBeenCalledWith(
      expect.any(Date),
      "12:00",
      40.7128,
      -74.006,
      -4
    );
  });
});
