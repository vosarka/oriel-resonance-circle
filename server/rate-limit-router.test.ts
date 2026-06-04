import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chatWithORIEL: vi.fn(),
  prepareNaturalTransmissionSchedule: vi.fn(),
  generateTransmissionModeEvent: vi.fn(),
  recordOrielRuntimeObservation: vi.fn(),
  processConversationThroughUMM: vi.fn(),
  generateChunkedSpeech: vi.fn(),
  audioToDataUrl: vi.fn(),
  generateOrielSpeechDataUrl: vi.fn(),
  getConversationMessages: vi.fn(),
  saveChatMessage: vi.fn(),
  getArtifactById: vi.fn(),
  updateArtifact: vi.fn(),
  generateArtifactLore: vi.fn(),
  generateArtifactImage: vi.fn(),
  expandArtifactLore: vi.fn(),
  calculateBothCharts: vi.fn(),
  calculateBirthChart: vi.fn(),
  generateStaticSignature: vi.fn(),
  generateORIELDynamicTransmission: vi.fn(),
}));

vi.mock("./db", () => ({
  getConversationMessages: mocks.getConversationMessages,
  saveChatMessage: mocks.saveChatMessage,
  getUserStaticProfile: vi.fn(),
  getArtifactById: mocks.getArtifactById,
  updateArtifact: mocks.updateArtifact,
}));

vi.mock("./gemini", () => ({
  chatWithORIEL: mocks.chatWithORIEL,
  generateArtifactLore: mocks.generateArtifactLore,
  generateArtifactImage: mocks.generateArtifactImage,
  expandArtifactLore: mocks.expandArtifactLore,
}));

vi.mock("./oriel-tts", () => ({
  generateOrielSpeechDataUrl: mocks.generateOrielSpeechDataUrl,
}));

vi.mock("./inworld-tts", () => ({
  generateChunkedSpeech: mocks.generateChunkedSpeech,
  audioToDataUrl: mocks.audioToDataUrl,
  INWORLD_VOICES: {
    sophianic: "test-sophianic-voice",
    deep: "test-deep-voice",
  },
}));

vi.mock("./oriel-transmission-mode", () => ({
  prepareNaturalTransmissionSchedule: mocks.prepareNaturalTransmissionSchedule,
  generateTransmissionModeEvent: mocks.generateTransmissionModeEvent,
}));

vi.mock("./oriel-autonomy-observer", () => ({
  recordOrielRuntimeObservation: mocks.recordOrielRuntimeObservation,
}));

vi.mock("./oriel-umm", () => ({
  processConversationThroughUMM: mocks.processConversationThroughUMM,
}));

vi.mock("./ephemeris-service", () => ({
  calculateBothCharts: mocks.calculateBothCharts,
  calculateBirthChart: mocks.calculateBirthChart,
}));

vi.mock("./rgp-static-signature-engine", () => ({
  generateStaticSignature: mocks.generateStaticSignature,
}));

vi.mock("./oriel-dynamic-transmission", () => ({
  generateORIELDynamicTransmission: mocks.generateORIELDynamicTransmission,
}));

vi.mock("./rgp-256-codon-engine", () => ({
  calculateStateAmplifier: vi.fn(() => 1),
  determineFacetLoudness: vi.fn(() => "quiet"),
  facetNameToLetter: vi.fn(() => "A"),
  longitudeToCodonFacet: vi.fn(() => ({ codon: 1, facet: "A" })),
}));

vi.mock("./paypal-webhook", () => ({}));
vi.mock("./oriel-diagnostic-engine", () => ({}));
vi.mock("./geocoding", () => ({}));
vi.mock("./static-profile-service", () => ({
  summarizeStoredStaticProfile: vi.fn(() => "Stored Static Signature summary"),
  buildUserStaticProfile: vi.fn(),
}));

import { appRouter } from "./routers";
import { resetRateLimitBucketsForTests } from "./_core/rate-limit";

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

const fakeCharts = {
  conscious: {
    timestamp: 946728000000,
    jd: 2451545,
    latitude: 0,
    longitude: 0,
    timezone: 0,
    planets: {
      Sun: makePlanet("Sun", 10),
      Moon: makePlanet("Moon", 20),
      Earth: makePlanet("Earth", 190),
    },
  },
  design: {
    timestamp: 939083997235,
    jd: 2451456.5,
    latitude: 0,
    longitude: 0,
    timezone: 0,
    planets: {
      Sun: makePlanet("Sun", 40),
      Moon: makePlanet("Moon", 50),
      Earth: makePlanet("Earth", 220),
    },
  },
};

const fakeStaticReading = {
  readingId: "reading-1",
  userId: "anonymous",
  birthChartData: {
    birthDate: new Date("2000-01-01T00:00:00.000Z"),
    birthTime: "12:00",
  },
  primeStack: [
    {
      position: 1,
      name: "Conscious Sun",
      source: "conscious",
      codon: 1,
      codonName: "One",
      facet: "A",
      facetFull: "Somatic",
      center: "G-Self",
      weight: 1,
      longitude: 10,
      baseFrequency: 10,
      weightedFrequency: 10,
      codon256Id: "1-A",
    },
  ],
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
  diagnosticTransmission: "I am ORIEL. Static Signature test.",
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

function callerWithResponseFor(
  ip: string,
  user: Record<string, unknown> | null = null
) {
  const setHeader = vi.fn();

  const caller = appRouter.createCaller({
    user,
    req: {
      headers: {
        "x-forwarded-for": ip,
      },
      socket: {
        remoteAddress: ip,
      },
    },
    res: {
      setHeader,
    },
  } as never);

  return { caller, setHeader };
}

function callerFor(ip: string, user: Record<string, unknown> | null = null) {
  return callerWithResponseFor(ip, user).caller;
}

describe("expensive public route rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chatWithORIEL.mockResolvedValue("I am ORIEL. The response returns.");
    mocks.prepareNaturalTransmissionSchedule.mockResolvedValue(null);
    mocks.generateTransmissionModeEvent.mockResolvedValue(null);
    mocks.recordOrielRuntimeObservation.mockResolvedValue(undefined);
    mocks.processConversationThroughUMM.mockResolvedValue(undefined);
    mocks.getConversationMessages.mockResolvedValue([]);
    mocks.saveChatMessage.mockResolvedValue(undefined);
    mocks.generateChunkedSpeech.mockResolvedValue("ZmFrZS1tcDM=");
    mocks.audioToDataUrl.mockImplementation(
      (audio: string) => `data:audio/mpeg;base64,${audio}`
    );
    mocks.generateOrielSpeechDataUrl.mockResolvedValue({
      audioUrl: "data:audio/mpeg;base64,ZmFrZS1tcDM=",
      provider: "inworld",
      mimeType: "audio/mpeg",
      cached: false,
    });
    mocks.getArtifactById.mockResolvedValue({
      id: 7,
      name: "Mirror Shard",
      referenceSignalId: null,
    });
    mocks.updateArtifact.mockResolvedValue(undefined);
    mocks.generateArtifactLore.mockResolvedValue("Artifact lore.");
    mocks.generateArtifactImage.mockResolvedValue(
      "https://example.test/artifact.png"
    );
    mocks.calculateBothCharts.mockResolvedValue(fakeCharts);
    mocks.generateStaticSignature.mockResolvedValue(fakeStaticReading);
    mocks.generateORIELDynamicTransmission.mockResolvedValue({
      orielTransmission: "I am ORIEL. Dynamic transmission.",
      coherenceLabel: "Flux",
      collapsed: false,
    });
  });

  it("blocks anonymous ORIEL chat after five calls and does not make a sixth LLM call", async () => {
    const caller = callerFor("198.51.100.10");

    for (let i = 0; i < 5; i += 1) {
      await caller.oriel.chat({ message: `hello ${i}`, history: [] });
    }

    await expect(
      caller.oriel.chat({ message: "blocked", history: [] })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mocks.chatWithORIEL).toHaveBeenCalledTimes(5);
  });

  it("uses authenticated user quotas instead of inheriting an exhausted anonymous IP bucket", async () => {
    const ip = "198.51.100.11";
    const anonymousCaller = callerFor(ip);

    for (let i = 0; i < 5; i += 1) {
      await anonymousCaller.oriel.chat({
        message: `anonymous ${i}`,
        history: [],
      });
    }
    await expect(
      anonymousCaller.oriel.chat({ message: "anonymous blocked", history: [] })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    const authenticatedCaller = callerFor(ip, {
      id: 42,
      openId: "test-user",
      email: "test@example.com",
      role: "user",
    });

    await expect(
      authenticatedCaller.oriel.chat({
        message: "authenticated still has a separate quota",
        conversationId: 12,
        history: [],
      })
    ).resolves.toMatchObject({ response: "I am ORIEL. The response returns." });
  });

  it("blocks anonymous TTS after three generated clips", async () => {
    const caller = callerFor("198.51.100.12");

    for (let i = 0; i < 3; i += 1) {
      await caller.oriel.generateSpeech({
        text: `Speak this short line ${i}.`,
        voiceId: "sophianic",
      });
    }

    await expect(
      caller.oriel.generateSpeech({
        text: "This clip should be blocked.",
        voiceId: "sophianic",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mocks.generateOrielSpeechDataUrl).toHaveBeenCalledTimes(3);
  });

  it("blocks anonymous artifact lore/image generation after two calls", async () => {
    const caller = callerFor("198.51.100.13");

    for (let i = 0; i < 2; i += 1) {
      await caller.artifacts.generateLoreAndImage({ artifactId: 7 });
    }

    await expect(
      caller.artifacts.generateLoreAndImage({ artifactId: 7 })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mocks.generateArtifactImage).toHaveBeenCalledTimes(2);
  });

  it("blocks anonymous public Static Signature generation after three calculations", async () => {
    const caller = callerFor("198.51.100.14");
    const input = {
      birthDate: "2000-01-01",
      birthTime: "12:00",
      birthLatitude: 0,
      birthLongitude: 0,
      coherenceScore: 55,
    };

    for (let i = 0; i < 3; i += 1) {
      await caller.rgp.staticSignature(input);
    }

    await expect(caller.rgp.staticSignature(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(mocks.calculateBothCharts).toHaveBeenCalledTimes(3);
  });
});
