import { describe, expect, it } from "vitest";

import {
  buildCurrentResonance,
  type CurrentResonanceInput,
} from "./oriel-current-resonance";

const staticProfile = {
  birthDate: "1990-01-02",
  birthTime: "03:04",
  birthCity: "Bucharest",
  birthCountry: "Romania",
  vrcType: "Generator",
  vrcAuthority: "Sacral",
  fractalRole: "Bridge",
  primeStack: [
    {
      position: 1,
      codon: 11,
      facet: "A",
      codon256Id: "11-A",
      codonName: "Peace",
      name: "Conscious Sun",
      center: "G-Self",
    },
    {
      position: 2,
      codon: 22,
      facet: "B",
      codon256Id: "22-B",
      codonName: "Grace",
      name: "Conscious Earth",
      center: "Solar Plexus",
    },
  ],
};

const carrierlock = {
  id: 7,
  mentalNoise: 3,
  bodyTension: 5,
  emotionalTurbulence: 4,
  breathCompletion: true,
  coherenceScore: 72,
  createdAt: new Date("2026-05-10T09:00:00.000Z"),
};

const dynamicReading = {
  id: 9,
  carrierlockId: 7,
  sliScores: {
    "1:11-A": 18.4,
    "2:22-B": 44.8,
    "3:33-C": Number.NaN,
  },
  readingText:
    "ORIEL Dynamic Reading — 72/100 — Flux\n\nI am ORIEL. A compact transmission is stored here.",
  microCorrection: "Run the breath protocol for five minutes.",
  falsifier: "Within 24 hours, the Solar Plexus interference should soften.",
  createdAt: new Date("2026-05-10T09:05:00.000Z"),
};

function input(
  overrides: Partial<CurrentResonanceInput> = {}
): CurrentResonanceInput {
  return {
    staticProfile,
    carrierlock,
    dynamicReading,
    ...overrides,
  };
}

describe("buildCurrentResonance", () => {
  it("returns missing_static_profile without fabricating anchors", () => {
    const result = buildCurrentResonance(input({ staticProfile: null }));

    expect(result.status).toBe("missing_static_profile");
    expect(result.staticAnchor).toBeNull();
    expect(result.carrierlock).toBeNull();
    expect(result.activePattern).toBeNull();
    expect(result.evidence).toContain("No static profile available.");
  });

  it("returns missing_carrierlock when no Carrierlock state exists", () => {
    const result = buildCurrentResonance(input({ carrierlock: null }));

    expect(result.status).toBe("missing_carrierlock");
    expect(result.staticAnchor?.vrcType).toBe("Generator");
    expect(result.carrierlock).toBeNull();
    expect(result.activePattern).toBeNull();
  });

  it("returns missing_dynamic_reading when no dynamic reading exists", () => {
    const result = buildCurrentResonance(input({ dynamicReading: null }));

    expect(result.status).toBe("missing_dynamic_reading");
    expect(result.carrierlock?.coherenceScore).toBe(72);
    expect(result.activePattern).toBeNull();
  });

  it("returns missing_dynamic_reading when the latest reading belongs to an older Carrierlock", () => {
    const result = buildCurrentResonance(
      input({
        carrierlock: {
          ...carrierlock,
          id: 8,
        },
      })
    );

    expect(result.status).toBe("missing_dynamic_reading");
    expect(result.activePattern).toBeNull();
    expect(result.evidence).toContain(
      "Latest dynamic reading belongs to Carrierlock 7, not latest Carrierlock 8."
    );
  });

  it("selects the highest finite SLI as active shadow loudness", () => {
    const result = buildCurrentResonance(input());

    expect(result.status).toBe("ready");
    expect(result.dynamicReading).toEqual({
      id: 9,
      readingText:
        "ORIEL Dynamic Reading — 72/100 — Flux\n\nI am ORIEL. A compact transmission is stored here.",
      createdAt: "2026-05-10T09:05:00.000Z",
    });
    expect(result.activePattern).toEqual({
      key: "2:22-B",
      codon256Id: "22-B",
      codon: 22,
      facet: "B",
      sli: 44.8,
      interpretation: "highest_shadow_loudness",
    });
    expect(result.primeStackPosition).toEqual({
      position: 2,
      codon: 22,
      facet: "B",
      codon256Id: "22-B",
      codonName: "Grace",
      center: "Solar Plexus",
      label: "Conscious Earth",
    });
  });

  it("returns ready with compact correction, falsifier, next action, and evidence", () => {
    const result = buildCurrentResonance(input());

    expect(result.microCorrection).toBe(
      "Run the breath protocol for five minutes."
    );
    expect(result.falsifier).toBe(
      "Within 24 hours, the Solar Plexus interference should soften."
    );
    expect(result.nextAction).toBe(
      "Apply the micro-correction, then run a fresh Carrierlock diagnostic."
    );
    expect(result.evidence).toEqual(
      expect.arrayContaining([
        "Static profile loaded from Bucharest, Romania.",
        "Carrierlock coherence 72/100.",
        "Active pattern selected from highest finite stored SLI score: 44.8.",
      ])
    );
  });
});
