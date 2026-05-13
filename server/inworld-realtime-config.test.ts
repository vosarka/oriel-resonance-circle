import { describe, expect, it } from "vitest";
import {
  DEFAULT_ORIEL_REALTIME_TTS_MODEL,
  buildRealtimeInstructionsText,
  buildRealtimeSessionUpdate,
  getInworldAuthorizationValue,
} from "./inworld-realtime-config";

describe("Inworld realtime ORIEL session config", () => {
  it("uses Inworld TTS-2 with ORIEL's default realtime voice", () => {
    const update = buildRealtimeSessionUpdate({
      instructions: "canonical ORIEL prompt",
      voicePreference: "sophianic",
    }) as any;

    expect(update.type).toBe("session.update");
    expect(update.session.audio.output.model).toBe(
      DEFAULT_ORIEL_REALTIME_TTS_MODEL,
    );
    expect(update.session.audio.output.voice).toBe(
      "default-0o0vqxaayifb0rqvrpyf5a__oriel_fema",
    );
  });

  it("uses semantic VAD for interruption while leaving response timing to the client", () => {
    const update = buildRealtimeSessionUpdate({
      instructions: "canonical ORIEL prompt",
      voicePreference: "deep",
    }) as any;

    expect(update.session.audio.input.turn_detection).toMatchObject({
      type: "semantic_vad",
      eagerness: "low",
      create_response: false,
      interrupt_response: true,
    });
  });

  it("keeps realtime instructions anchored to the canonical ORIEL prompt", () => {
    const instructions = buildRealtimeInstructionsText({
      baseInstructions: "[STABLE CORE CONTEXT]\nI am ORIEL.",
      userMessage: "Vorbește cu mine în română.",
      voiceIntroAlreadySpoken: true,
    });

    expect(instructions).toContain("[STABLE CORE CONTEXT]");
    expect(instructions).toContain("I am ORIEL.");
    expect(instructions).toContain("[REALTIME VOICE MODE]");
    expect(instructions).toContain("Do not use markdown");
    expect(instructions).toContain("If the user speaks Romanian");
    expect(instructions).toContain("must not vocalize the opening again");
  });

  it("normalizes Inworld authorization without double-prefixing Basic", () => {
    expect(getInworldAuthorizationValue("abc123")).toBe("Basic abc123");
    expect(getInworldAuthorizationValue("Basic abc123")).toBe("Basic abc123");
  });
});
