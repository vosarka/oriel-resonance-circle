import { describe, expect, it } from "vitest";
import {
  shouldVoiceModeInterruptPlayback,
  shouldVoiceModeRequestManualResponse,
} from "../client/src/lib/voice-mode";

describe("VoiceMode realtime response policy", () => {
  it("does not request manual responses when Inworld auto-response is enabled", () => {
    expect(
      shouldVoiceModeRequestManualResponse({
        realtimeAutoResponds: true,
        hasSpeechSinceLastResponse: true,
        isWaitMode: false,
      }),
    ).toBe(false);
  });

  it("keeps legacy manual response behavior available when auto-response is disabled", () => {
    expect(
      shouldVoiceModeRequestManualResponse({
        realtimeAutoResponds: false,
        hasSpeechSinceLastResponse: true,
        isWaitMode: false,
      }),
    ).toBe(true);
    expect(
      shouldVoiceModeRequestManualResponse({
        realtimeAutoResponds: false,
        hasSpeechSinceLastResponse: true,
        isWaitMode: true,
      }),
    ).toBe(false);
  });

  it("lets server speech-start events interrupt ORIEL playback", () => {
    expect(
      shouldVoiceModeInterruptPlayback({
        speechSource: "server",
        assistantResponseActive: true,
        isPlaying: true,
      }),
    ).toBe(true);
  });

  it("still suppresses local echo-triggered interruption while ORIEL is speaking", () => {
    expect(
      shouldVoiceModeInterruptPlayback({
        speechSource: "local",
        assistantResponseActive: true,
        isPlaying: true,
      }),
    ).toBe(false);
  });
});
