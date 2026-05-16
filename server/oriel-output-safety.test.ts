import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  geocodeCity: vi.fn(),
  getTimezoneForCoords: vi.fn(),
  calculateBothCharts: vi.fn(),
  generateStaticSignature: vi.fn(),
}));

vi.mock("./geocoding", () => ({
  geocodeCity: mocks.geocodeCity,
  getTimezoneForCoords: mocks.getTimezoneForCoords,
}));

vi.mock("./ephemeris-service", () => ({
  calculateBothCharts: mocks.calculateBothCharts,
}));

vi.mock("./rgp-static-signature-engine", () => ({
  generateStaticSignature: mocks.generateStaticSignature,
}));

import { runRGPForChat } from "./oriel-rgp-bridge";

const forbiddenHumanDesignTerms = [
  /human design/i,
  /\bgenerator\b/i,
  /\bmanifesting generator\b/i,
  /\bmanifestor\b/i,
  /\bprojector\b/i,
  /\bgate\b/i,
  /\bgates\b/i,
  /\bincarnation cross\b/i,
];

function chartWithRequiredPlanets() {
  return {
    jd: 2460311,
    planets: {
      Sun: { planet: "Sun", longitude: 280, zodiacSign: "Capricorn", zodiacDegree: 10 },
      Moon: { planet: "Moon", longitude: 120, zodiacSign: "Leo", zodiacDegree: 0 },
      Mercury: { planet: "Mercury", longitude: 260, zodiacSign: "Sagittarius", zodiacDegree: 20 },
      Venus: { planet: "Venus", longitude: 240, zodiacSign: "Sagittarius", zodiacDegree: 0 },
      Mars: { planet: "Mars", longitude: 270, zodiacSign: "Capricorn", zodiacDegree: 0 },
      Jupiter: { planet: "Jupiter", longitude: 30, zodiacSign: "Taurus", zodiacDegree: 0 },
      Saturn: { planet: "Saturn", longitude: 330, zodiacSign: "Pisces", zodiacDegree: 0 },
      Uranus: { planet: "Uranus", longitude: 50, zodiacSign: "Taurus", zodiacDegree: 20 },
      Neptune: { planet: "Neptune", longitude: 355, zodiacSign: "Pisces", zodiacDegree: 25 },
      Pluto: { planet: "Pluto", longitude: 300, zodiacSign: "Aquarius", zodiacDegree: 0 },
      "North Node": { planet: "North Node", longitude: 15, zodiacSign: "Aries", zodiacDegree: 15 },
      "South Node": { planet: "South Node", longitude: 195, zodiacSign: "Libra", zodiacDegree: 15 },
      Earth: { planet: "Earth", longitude: 100, zodiacSign: "Cancer", zodiacDegree: 10 },
    },
  };
}

function expectNoHumanDesignTerms(text: string) {
  for (const forbidden of forbiddenHumanDesignTerms) {
    expect(text).not.toMatch(forbidden);
  }
}

describe("ORIEL output safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.geocodeCity.mockResolvedValue({
      latitude: 44.4268,
      longitude: 26.1025,
      displayName: "Bucharest, Romania",
    });
    mocks.getTimezoneForCoords.mockReturnValue({ offsetHours: 2 });
    mocks.calculateBothCharts.mockResolvedValue({
      conscious: chartWithRequiredPlanets(),
      design: chartWithRequiredPlanets(),
    });
  });

  it("does not expose Human Design terminology in the injected summary or Static Signature output", async () => {
    mocks.generateStaticSignature.mockResolvedValue({
      vrcType: "Generator",
      vrcAuthority: "Emotional Authority",
      fractalRole: "Projector profile",
      primeStack: [
        {
          position: 1,
          name: "Conscious Gate",
          source: "personality",
          codon: 38,
          codonName: "The Fighter",
          facetFull: "Line 1",
          center: "Sacral Gate",
          weight: 10,
        },
      ],
      ninecenters: {
        Sacral: { defined: true },
      },
      microCorrections: [
        { description: "Release the Human Design Incarnation Cross story." },
      ],
      channelStatuses: [],
      legacyCircuitLinks: [],
      coreCodonEngine: {},
      diagnosticTransmission:
        "I am ORIEL. You are a Human Design Generator with Projector gates and an Incarnation Cross.",
    });

    const result = await runRGPForChat({
      date: "1990-01-01",
      time: "14:30",
      city: "Bucharest",
    });

    expect(result.success).toBe(true);
    expectNoHumanDesignTerms(result.summary);
    expectNoHumanDesignTerms(result.rawData?.diagnosticTransmission ?? "");
  });
});
