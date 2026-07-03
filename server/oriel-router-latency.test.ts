import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConversationById: vi.fn(),
  getConversationMessages: vi.fn(),
  saveChatMessage: vi.fn(),
  listGeneratedTransmissionEventsByConversation: vi.fn(),
  chatWithORIEL: vi.fn(),
  prepareNaturalTransmissionSchedule: vi.fn(),
  generateTransmissionModeEvent: vi.fn(),
  recordOrielRuntimeObservation: vi.fn(),
  processConversationThroughUMM: vi.fn(),
}));

vi.mock("./db", () => ({
  getConversationById: mocks.getConversationById,
  getConversationMessages: mocks.getConversationMessages,
  saveChatMessage: mocks.saveChatMessage,
  listGeneratedTransmissionEventsByConversation:
    mocks.listGeneratedTransmissionEventsByConversation,
}));

vi.mock("./gemini", () => ({
  chatWithORIEL: mocks.chatWithORIEL,
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
vi.mock("./paypal-webhook", () => ({}));
vi.mock("./oriel-diagnostic-engine", () => ({}));
vi.mock("./inworld-tts", () => ({}));
vi.mock("./geocoding", () => ({}));
vi.mock("./static-profile-service", () => ({}));
vi.mock("./ephemeris-service", () => ({}));
vi.mock("./rgp-256-codon-engine", () => ({}));

import { appRouter } from "./routers";

describe("ORIEL generated transmission polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getConversationMessages.mockResolvedValue([]);
    mocks.saveChatMessage.mockResolvedValue(undefined);
    mocks.chatWithORIEL.mockResolvedValue(
      "I am ORIEL. The answer returns first."
    );
    mocks.recordOrielRuntimeObservation.mockResolvedValue(undefined);
    mocks.processConversationThroughUMM.mockResolvedValue(undefined);
  });

  it("returns ordinary chat with a pending transmission without awaiting the generation job", async () => {
    const run = vi.fn(() => new Promise(() => {}));
    mocks.prepareNaturalTransmissionSchedule.mockResolvedValue({
      pending: {
        conversationId: 34,
        requestedAt: "2026-05-10T12:00:00.000Z",
        triggerSource: "oriel.chat",
      },
      run,
    });
    const caller = appRouter.createCaller({
      user: { id: 12 },
    } as never);

    const result = await Promise.race([
      caller.oriel.chat({
        message: "Hello ORIEL",
        conversationId: 34,
        history: [],
      }),
      new Promise<"timed-out">(resolve =>
        setTimeout(() => resolve("timed-out"), 500)
      ),
    ]);

    expect(result).not.toBe("timed-out");
    expect(result).toMatchObject({
      response: "I am ORIEL. The answer returns first.",
      conversationId: 34,
      transmissionEvent: null,
      pendingTransmission: {
        conversationId: 34,
        triggerSource: "oriel.chat",
      },
    });
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("returns null when the conversation does not belong to the user", async () => {
    mocks.getConversationById.mockResolvedValue(null);
    const caller = appRouter.createCaller({
      user: { id: 12 },
    } as never);

    const result = await caller.oriel.getLatestGeneratedTransmissionEvent({
      conversationId: 99,
      after: "2026-05-10T12:00:00.000Z",
    });

    expect(result).toBeNull();
    expect(
      mocks.listGeneratedTransmissionEventsByConversation
    ).not.toHaveBeenCalled();
  });

  it("returns the earliest parsed generated event for the owning user after the requested time", async () => {
    mocks.getConversationById.mockResolvedValue({ id: 34, userId: 12 });
    mocks.listGeneratedTransmissionEventsByConversation.mockResolvedValue([
      {
        id: 78,
        eventKey: "GTE-later",
        eventType: "oracle",
        rarity: "rare",
        meaningLevel: 3,
        triggerSource: "oriel.chat",
        status: "revealed",
        payload: JSON.stringify({ title: "Later Signal" }),
        sourceContext: JSON.stringify({ roll: { chance: 0.08 } }),
        createdAt: new Date("2026-05-10T12:00:04.000Z"),
      },
      {
        id: 77,
        eventKey: "GTE-first",
        eventType: "tx",
        rarity: "common",
        meaningLevel: 1,
        triggerSource: "oriel.chat",
        status: "generated",
        payload: JSON.stringify({ title: "First Signal" }),
        sourceContext: JSON.stringify({ roll: { chance: 0.025 } }),
        createdAt: new Date("2026-05-10T12:00:02.000Z"),
      },
      {
        id: 76,
        eventKey: "GTE-forced",
        eventType: "tx",
        rarity: "common",
        meaningLevel: 1,
        triggerSource: "oriel.chat.force",
        status: "revealed",
        payload: JSON.stringify({ title: "Forced Signal" }),
        sourceContext: "{}",
        createdAt: new Date("2026-05-10T12:00:01.000Z"),
      },
    ]);
    const caller = appRouter.createCaller({
      user: { id: 12 },
    } as never);

    const result = await caller.oriel.getLatestGeneratedTransmissionEvent({
      conversationId: 34,
      after: "2026-05-10T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      id: 77,
      eventKey: "GTE-first",
      payload: { title: "First Signal" },
      sourceContext: { roll: { chance: 0.025 } },
    });
  });
});
