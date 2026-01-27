import { describe, it, expect } from "vitest";
import { ENV } from "./_core/env";

describe("ElevenLabs Configuration", () => {
  it("should have ELEVENLABS_API_KEY configured", () => {
    expect(ENV.elevenLabsApiKey).toBeDefined();
    expect(ENV.elevenLabsApiKey).toMatch(/^sk_/);
  });

  it("should have ELEVENLABS_VOICE_ID configured", () => {
    expect(ENV.elevenLabsVoiceId).toBeDefined();
    expect(ENV.elevenLabsVoiceId).toBe("sxMbJDVSbjVtmRgDL1S1");
  });

  it("should validate API key by fetching voice details", async () => {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/voices/${ENV.elevenLabsVoiceId}`,
      {
        headers: {
          "xi-api-key": ENV.elevenLabsApiKey,
        },
      }
    );

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.voice_id).toBe(ENV.elevenLabsVoiceId);
  });

  // Note: Quota check skipped - API key lacks user_read permission
  // This is expected for keys with limited permissions
});
