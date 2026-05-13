import { describe, expect, it } from "vitest";
import {
  VOICE_MODE_MANUAL_RESPONSE_DELAY_MS,
  shouldVoiceModeShowWaitButton,
  shouldVoiceModeUseRealtimeAutoResponse,
  shouldVoiceModeInterruptPlayback,
  shouldVoiceModeRequestManualResponse,
  shouldVoiceModeStreamMicAudio,
} from "../client/src/lib/voice-mode";

describe("VoiceMode realtime response policy", () => {
  it("uses client-timed manual responses so ORIEL waits before answering", () => {
    expect(shouldVoiceModeUseRealtimeAutoResponse()).toBe(false);
    expect(VOICE_MODE_MANUAL_RESPONSE_DELAY_MS).toBe(3000);
  });

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

  it("does not stream microphone audio while mute or wait mode is active", () => {
    expect(
      shouldVoiceModeStreamMicAudio({
        websocketOpen: true,
        isMuted: true,
        isWaitMode: false,
      }),
    ).toBe(false);
    expect(
      shouldVoiceModeStreamMicAudio({
        websocketOpen: true,
        isMuted: false,
        isWaitMode: true,
      }),
    ).toBe(false);
    expect(
      shouldVoiceModeStreamMicAudio({
        websocketOpen: true,
        isMuted: false,
        isWaitMode: false,
      }),
    ).toBe(true);
  });

  it("hides the wait button while testing automatic realtime turn-taking", () => {
    expect(shouldVoiceModeShowWaitButton()).toBe(false);
  });
});
