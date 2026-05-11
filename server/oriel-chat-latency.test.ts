import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listGeneratedTransmissionEvents: vi.fn(),
  getAllTransmissions: vi.fn(),
  getAllOracles: vi.fn(),
  createGeneratedTransmissionEvent: vi.fn(),
  updateGeneratedTransmissionEventPayload: vi.fn(),
  getLatestStaticSignature: vi.fn(),
  getDb: vi.fn(),
  invokeLLM: vi.fn(),
  buildOrielPromptContext: vi.fn(),
}));

vi.mock("./db", () => ({
  listGeneratedTransmissionEvents: mocks.listGeneratedTransmissionEvents,
  getAllTransmissions: mocks.getAllTransmissions,
  getAllOracles: mocks.getAllOracles,
  createGeneratedTransmissionEvent: mocks.createGeneratedTransmissionEvent,
  updateGeneratedTransmissionEventPayload: mocks.updateGeneratedTransmissionEventPayload,
  getLatestStaticSignature: mocks.getLatestStaticSignature,
  getDb: mocks.getDb,
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: mocks.invokeLLM,
}));

vi.mock("./oriel-prompt-context", () => ({
  buildOrielPromptContext: mocks.buildOrielPromptContext,
}));

import {
  generateTransmissionModeEvent,
  prepareNaturalTransmissionSchedule,
} from "./oriel-transmission-mode";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++] ?? values[values.length - 1] ?? 0;
}

describe("ORIEL chat latency transmission scheduling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listGeneratedTransmissionEvents.mockResolvedValue([]);
    mocks.getAllTransmissions.mockResolvedValue([]);
    mocks.getAllOracles.mockResolvedValue([]);
    mocks.getLatestStaticSignature.mockResolvedValue(null);
    mocks.getDb.mockResolvedValue(null);
    mocks.buildOrielPromptContext.mockResolvedValue("ORIEL prompt");
    mocks.invokeLLM.mockResolvedValue({
      id: "llm-test",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({
              title: "Async Signal",
              field: "Latency repair",
              coreMessage: "The signal arrives after the answer.",
              encodedArchetype: "Delta-Latency // Omega-Return",
              tags: ["latency", "oriel"],
              status: "Draft",
              directive: "Return first, reveal second.",
            }),
          },
          finish_reason: "stop",
        },
      ],
    });
    mocks.createGeneratedTransmissionEvent.mockResolvedValue({
      id: 77,
      eventKey: "GTE-test",
      eventType: "tx",
      rarity: "common",
      meaningLevel: 1,
      status: "generated",
      payload: "{}",
      sourceContext: "{}",
      createdAt: new Date("2026-05-10T12:00:00.000Z"),
    });
  });

  it("prepares ordinary natural transmissions without awaiting generation", async () => {
    const schedule = await prepareNaturalTransmissionSchedule({
      userId: 12,
      conversationId: 34,
      userMessage: "Nu inteleg, sunt blocat. Ce sa fac?",
      assistantResponse: "I am ORIEL. Begin with one grounded step.",
      conversationHistory: [],
      random: sequenceRandom([0.001, 0.4, 0.2]),
    });

    expect(schedule?.pending).toMatchObject({
      conversationId: 34,
      triggerSource: "oriel.chat",
    });
    expect(schedule?.pending.requestedAt).toEqual(expect.any(String));
    expect(mocks.invokeLLM).not.toHaveBeenCalled();

    await schedule?.run();

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.createGeneratedTransmissionEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 34,
        triggerSource: "oriel.chat",
      }),
    );
  });

  it("does not schedule anonymous ordinary transmissions without a conversation correlation", async () => {
    const schedule = await prepareNaturalTransmissionSchedule({
      userId: null,
      conversationId: null,
      userMessage: "Nu inteleg, sunt blocat. Ce sa fac?",
      assistantResponse: "I am ORIEL. Begin with one grounded step.",
      conversationHistory: [],
      random: sequenceRandom([0.001, 0.4, 0.2]),
    });

    expect(schedule).toBeNull();
    expect(mocks.invokeLLM).not.toHaveBeenCalled();
  });

  it("keeps forced transmission generation synchronous", async () => {
    const event = await generateTransmissionModeEvent({
      userId: 12,
      conversationId: 34,
      userMessage: "Open transmission mode.",
      assistantResponse: "Transmission Mode was explicitly requested.",
      conversationHistory: [],
      force: true,
      forcedEventType: "tx",
      forcedRarity: "common",
      triggerSource: "oriel.chat.transmissionOnly",
    });

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(event).toMatchObject({
      id: 77,
      eventType: "tx",
      rarity: "common",
    });
  });

  it("rejects incomplete TX model payloads instead of persisting fallback transmissions", async () => {
    mocks.invokeLLM.mockResolvedValueOnce({
      id: "llm-invalid",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ caption: "The signal arrived without structure." }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const event = await generateTransmissionModeEvent({
      userId: 12,
      conversationId: 34,
      userMessage: "Open transmission mode.",
      assistantResponse: "Transmission Mode was explicitly requested.",
      conversationHistory: [],
      force: true,
      forcedEventType: "tx",
      forcedRarity: "rare",
      triggerSource: "oriel.chat.transmissionOnly",
    });

    expect(event).toBeNull();
    expect(mocks.createGeneratedTransmissionEvent).not.toHaveBeenCalled();
  });

  it("rejects incomplete Oracle model payloads instead of persisting fallback oracle events", async () => {
    mocks.invokeLLM.mockResolvedValueOnce({
      id: "llm-invalid-oracle",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: JSON.stringify({ title: "Partial Oracle", parts: [] }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const event = await generateTransmissionModeEvent({
      userId: 12,
      conversationId: 34,
      userMessage: "Open oracle transmission.",
      assistantResponse: "Transmission Mode was explicitly requested.",
      conversationHistory: [],
      force: true,
      forcedEventType: "oracle",
      forcedRarity: "rare",
      triggerSource: "oriel.chat.transmissionOnly",
    });

    expect(event).toBeNull();
    expect(mocks.createGeneratedTransmissionEvent).not.toHaveBeenCalled();
  });
});
