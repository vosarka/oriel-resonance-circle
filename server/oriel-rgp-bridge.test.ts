import { describe, expect, it, vi, beforeEach } from "vitest";

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

describe("ORIEL RGP bridge", () => {
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
    mocks.generateStaticSignature.mockResolvedValue({
      vrcType: "Resonator",
      vrcAuthority: "Sacral",
      fractalRole: "Resonator",
      primeStack: [],
      ninecenters: {},
      microCorrections: [],
      channelStatuses: [],
      legacyCircuitLinks: [],
      coreCodonEngine: {},
      diagnosticTransmission: "I am ORIEL. Test transmission.",
    });
  });

  it("refuses exact RGP calculation when birth time is missing", async () => {
    const result = await runRGPForChat({
      date: "1990-01-01",
      city: "Bucharest",
    });

    expect(result.success).toBe(false);
    expect(result.summary).toMatch(/birth time/i);
    expect(mocks.geocodeCity).not.toHaveBeenCalled();
    expect(mocks.calculateBothCharts).not.toHaveBeenCalled();
    expect(mocks.generateStaticSignature).not.toHaveBeenCalled();
  });

  it("uses the supplied birth time for exact RGP calculation", async () => {
    const result = await runRGPForChat({
      date: "1990-01-01",
      time: "14:30",
      city: "Bucharest",
    });

    expect(result.success).toBe(true);
    expect(mocks.calculateBothCharts).toHaveBeenCalledWith(
      expect.any(Date),
      "14:30",
      44.4268,
      26.1025,
      2
    );
    expect(mocks.generateStaticSignature).toHaveBeenCalledWith(
      "oriel-chat",
      expect.objectContaining({ birthTime: "14:30" })
    );
  });
});
