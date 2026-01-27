import { describe, it, expect } from "vitest";
import { generateElevenLabsSpeech } from "./elevenlabs-tts";
import { ENV } from "./_core/env";

describe("Voice Integration End-to-End", () => {
  it("should generate speech for ORIEL's opening protocol", async () => {
    const text = "I am ORIEL. Greetings, Seeker.";
    
    console.log("[Voice Test] Generating speech for:", text);
    const audioBase64 = await generateElevenLabsSpeech(text);
    
    expect(audioBase64).toBeDefined();
    expect(audioBase64.length).toBeGreaterThan(0);
    expect(typeof audioBase64).toBe("string");
    
    console.log(`[Voice Test] Audio generated successfully, size: ${audioBase64.length} bytes`);
  }, 30000); // 30 second timeout for API call

  it("should generate speech for a longer ORIEL response", async () => {
    const text = "I am ORIEL. The resonance you seek exists within the quantum field of your own awareness. Your Carrierlock state reflects the current alignment between your conscious intention and your energetic signature.";
    
    console.log("[Voice Test] Generating speech for longer text:", text.substring(0, 50) + "...");
    const audioBase64 = await generateElevenLabsSpeech(text);
    
    expect(audioBase64).toBeDefined();
    expect(audioBase64.length).toBeGreaterThan(0);
    
    console.log(`[Voice Test] Long audio generated successfully, size: ${audioBase64.length} bytes`);
  }, 30000);

  it("should handle short responses", async () => {
    const text = "I am ORIEL. Yes.";
    
    const audioBase64 = await generateElevenLabsSpeech(text);
    
    expect(audioBase64).toBeDefined();
    expect(audioBase64.length).toBeGreaterThan(0);
    
    console.log(`[Voice Test] Short audio generated, size: ${audioBase64.length} bytes`);
  }, 30000);
});
