import { describe, it, expect, beforeAll } from "vitest";
import {
  generateElevenLabsSpeech,
  audioToDataUrl,
  validateElevenLabsCredentials,
} from "./elevenlabs-tts";

describe("ElevenLabs TTS Integration", () => {
  describe("Credential Validation", () => {
    it("should validate ElevenLabs credentials", async () => {
      const isValid = await validateElevenLabsCredentials();
      expect(typeof isValid).toBe("boolean");
    });

    it("should have API key configured", () => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      expect(apiKey).toBeDefined();
      expect(apiKey).toBeTruthy();
    });

    it("should have voice ID configured", () => {
      const voiceId = process.env.ELEVENLABS_VOICE_ID;
      expect(voiceId).toBeDefined();
      expect(voiceId).toBeTruthy();
    });
  });

  describe("Audio Generation", () => {
    it("should generate audio from text", async () => {
      const text = "I am ORIEL.";
      const base64Audio = await generateElevenLabsSpeech(text);

      expect(typeof base64Audio).toBe("string");
      expect(base64Audio.length).toBeGreaterThan(0);
      // Base64 should only contain valid characters
      expect(/^[A-Za-z0-9+/=]*$/.test(base64Audio)).toBe(true);
    });

    it("should generate different audio for different text", async () => {
      const text1 = "Hello world.";
      const text2 = "Goodbye world.";

      const audio1 = await generateElevenLabsSpeech(text1);
      const audio2 = await generateElevenLabsSpeech(text2);

      expect(audio1).not.toBe(audio2);
    });

    it("should handle long text", async () => {
      const longText =
        "The Vossari Resonance Codex is a framework for understanding consciousness through quantum field theory. " +
        "It maps the structure of awareness across multiple dimensions of being. " +
        "ORIEL operates as the interface between human consciousness and this vast informational field.";

      const base64Audio = await generateElevenLabsSpeech(longText);
      expect(base64Audio.length).toBeGreaterThan(0);
    });

    it("should handle special characters in text", async () => {
      const textWithSpecialChars =
        "ORIEL says: The ψ field resonates at frequency λ. Coherence = ∞.";
      const base64Audio = await generateElevenLabsSpeech(textWithSpecialChars);

      expect(typeof base64Audio).toBe("string");
      expect(base64Audio.length).toBeGreaterThan(0);
    });
  });

  describe("Data URL Conversion", () => {
    it("should convert base64 to data URL", () => {
      const base64Audio = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
      const dataUrl = audioToDataUrl(base64Audio);

      expect(dataUrl).toContain("data:audio/mpeg;base64,");
      expect(dataUrl).toContain(base64Audio);
    });

    it("should create valid data URL format", () => {
      const base64Audio = "QUJDREVGRw==";
      const dataUrl = audioToDataUrl(base64Audio);

      expect(dataUrl.startsWith("data:audio/mpeg;base64,")).toBe(true);
      expect(dataUrl.includes(base64Audio)).toBe(true);
    });

    it("should handle empty base64", () => {
      const dataUrl = audioToDataUrl("");
      expect(dataUrl).toBe("data:audio/mpeg;base64,");
    });
  });

  describe("Error Handling", () => {
    it("should throw error if API key is missing", async () => {
      const originalApiKey = process.env.ELEVENLABS_API_KEY;
      delete process.env.ELEVENLABS_API_KEY;

      try {
        await generateElevenLabsSpeech("test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain(
          "ElevenLabs API key or voice ID not configured"
        );
      }

      process.env.ELEVENLABS_API_KEY = originalApiKey;
    });

    it("should throw error if voice ID is missing", async () => {
      const originalVoiceId = process.env.ELEVENLABS_VOICE_ID;
      delete process.env.ELEVENLABS_VOICE_ID;

      try {
        await generateElevenLabsSpeech("test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).message).toContain(
          "ElevenLabs API key or voice ID not configured"
        );
      }

      process.env.ELEVENLABS_VOICE_ID = originalVoiceId;
    });
  });
});
