import { describe, expect, it } from "vitest";
import {
  getConduitInputDisabled,
  getSpeechFallbackTimeoutMs,
  getSpeechFallbackWatchdogDecision,
} from "../client/src/lib/conduit-voice";

describe("Conduit voice interaction guards", () => {
  it("does not block chat input while voice playback is speaking", () => {
    expect(
      getConduitInputDisabled({
        chatPending: false,
        isSpeaking: true,
        transmissionInterfering: false,
      })
    ).toBe(false);
  });

  it("still blocks chat input while the chat request or transmission gate is active", () => {
    expect(
      getConduitInputDisabled({
        chatPending: true,
        isSpeaking: false,
        transmissionInterfering: false,
      })
    ).toBe(true);
    expect(
      getConduitInputDisabled({
        chatPending: false,
        isSpeaking: false,
        transmissionInterfering: true,
      })
    ).toBe(true);
  });

  it("caps browser speech fallback timeout so voice state cannot stay stuck forever", () => {
    expect(getSpeechFallbackTimeoutMs("short response")).toBeGreaterThanOrEqual(
      4000
    );
    expect(
      getSpeechFallbackTimeoutMs("word ".repeat(1000))
    ).toBeLessThanOrEqual(25000);
  });

  it("extends the browser speech watchdog while speech is still actively playing", () => {
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 25_000,
        isSpeaking: true,
      })
    ).toBe("extend");
  });

  it("clears browser speech fallback after the hard watchdog limit or when speech is not active", () => {
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 121_000,
        isSpeaking: true,
      })
    ).toBe("clear");
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 25_000,
        isSpeaking: false,
      })
    ).toBe("clear");
  });
});
