import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  generateChunkedSpeech: vi.fn(),
  audioToDataUrl: vi.fn(),
}));

vi.mock("./inworld-tts", () => ({
  generateChunkedSpeech: mocks.generateChunkedSpeech,
  audioToDataUrl: mocks.audioToDataUrl,
  INWORLD_VOICES: {
    sophianic: "inworld-sophianic-test-voice",
    deep: "inworld-deep-test-voice",
  },
}));

const originalEnv = {
  VOXCPM_TTS_URL: process.env.VOXCPM_TTS_URL,
  VOXCPM_TTS_API_KEY: process.env.VOXCPM_TTS_API_KEY,
};

async function loadModule() {
  vi.resetModules();
  return import("./oriel-tts");
}

describe("ORIEL TTS provider selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.VOXCPM_TTS_URL;
    delete process.env.VOXCPM_TTS_API_KEY;
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    if (originalEnv.VOXCPM_TTS_URL === undefined) {
      delete process.env.VOXCPM_TTS_URL;
    } else {
      process.env.VOXCPM_TTS_URL = originalEnv.VOXCPM_TTS_URL;
    }

    if (originalEnv.VOXCPM_TTS_API_KEY === undefined) {
      delete process.env.VOXCPM_TTS_API_KEY;
    } else {
      process.env.VOXCPM_TTS_API_KEY = originalEnv.VOXCPM_TTS_API_KEY;
    }
    vi.unstubAllGlobals();
  });

  it("uses private VoxCPM2 when URL and API key are configured", async () => {
    process.env.VOXCPM_TTS_URL = "https://voice.example.test/";
    process.env.VOXCPM_TTS_API_KEY = "super-secret-test-key";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        audioBase64: "d2F2LWJ5dGVz",
        mimeType: "audio/wav",
        cached: false,
        provider: "voxcpm2",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { generateOrielSpeechDataUrl } = await loadModule();
    const result = await generateOrielSpeechDataUrl("  I am ORIEL.  ", "sophianic");

    expect(result).toEqual({
      audioUrl: "data:audio/wav;base64,d2F2LWJ5dGVz",
      provider: "voxcpm2",
      mimeType: "audio/wav",
      cached: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://voice.example.test/tts",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer super-secret-test-key",
          "Content-Type": "application/json",
        }),
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      text: "I am ORIEL.",
      voice: "sophianic",
    });
    expect(mocks.generateChunkedSpeech).not.toHaveBeenCalled();
  });

  it("falls back to Inworld when VoxCPM2 is not configured", async () => {
    mocks.generateChunkedSpeech.mockResolvedValue("bXAzLWJ5dGVz");
    mocks.audioToDataUrl.mockReturnValue("data:audio/mpeg;base64,bXAzLWJ5dGVz");

    const { generateOrielSpeechDataUrl } = await loadModule();
    const result = await generateOrielSpeechDataUrl("Speak through the old path.", "deep");

    expect(result).toEqual({
      audioUrl: "data:audio/mpeg;base64,bXAzLWJ5dGVz",
      provider: "inworld",
      mimeType: "audio/mpeg",
      cached: false,
    });
    expect(mocks.generateChunkedSpeech).toHaveBeenCalledWith(
      "Speak through the old path.",
      "inworld-deep-test-voice"
    );
  });

  it("fails closed when only one VoxCPM2 env var is configured", async () => {
    process.env.VOXCPM_TTS_URL = "https://voice.example.test";

    const { generateOrielSpeechDataUrl } = await loadModule();

    await expect(
      generateOrielSpeechDataUrl("Partial config should not be used.", "sophianic")
    ).rejects.toThrow("VOXCPM_TTS_API_KEY");
    expect(mocks.generateChunkedSpeech).not.toHaveBeenCalled();
  });
});
