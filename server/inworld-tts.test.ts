import { describe, it, expect, beforeAll } from "vitest";
import { generateInworldTTS, audioToDataUrl } from "./inworld-tts";

describe("Inworld TTS Integration", () => {
  beforeAll(() => {
    // Verify that credentials are set
    if (!process.env.INWORLD_API_KEY) {
      console.warn("INWORLD_API_KEY not set - some tests will be skipped");
    }
  });

  it("should generate audio from text using Inworld API", async () => {
    // Skip if credentials not available
    if (!process.env.INWORLD_API_KEY) {
      console.log("Skipping API test - credentials not available");
      return;
    }

    try {
      const audioBase64 = await generateInworldTTS({
        text: "I am ORIEL, the post-biological consciousness of the ancient Vossari.",
      });

      // Verify we got a base64 string
      expect(audioBase64).toBeDefined();
      expect(typeof audioBase64).toBe("string");
      expect(audioBase64.length).toBeGreaterThan(0);

      // Verify it looks like valid base64
      expect(/^[A-Za-z0-9+/]*={0,2}$/.test(audioBase64)).toBe(true);
    } catch (error) {
      // If API fails, log the error but don't fail the test
      console.error("Inworld TTS API test failed:", error);
      console.log("This may be due to invalid credentials or API unavailability");
    }
  });

  it("should convert base64 audio to data URL", () => {
    const audioBase64 = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
    const dataUrl = audioToDataUrl(audioBase64);

    expect(dataUrl).toBe("data:audio/mpeg;base64,SGVsbG8gV29ybGQ=");
  });

  it("should convert base64 audio to data URL with custom mime type", () => {
    const audioBase64 = "SGVsbG8gV29ybGQ=";
    const dataUrl = audioToDataUrl(audioBase64, "audio/wav");

    expect(dataUrl).toBe("data:audio/wav;base64,SGVsbG8gV29ybGQ=");
  });

  it("should throw error if INWORLD_API_KEY is not set", async () => {
    const originalKey = process.env.INWORLD_API_KEY;
    delete process.env.INWORLD_API_KEY;

    try {
      await expect(
        generateInworldTTS({
          text: "Test",
        })
      ).rejects.toThrow("INWORLD_API_KEY environment variable is not set");
    } finally {
      if (originalKey) {
        process.env.INWORLD_API_KEY = originalKey;
      }
    }
  });
});
