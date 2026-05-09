import { describe, expect, it } from "vitest";
import { classifyMemoryCandidate } from "./oriel-memory-consecration";

describe("ORIEL Memory Consecration", () => {
  it("requires consent for sensitive wound memories", () => {
    const result = classifyMemoryCandidate({
      category: "emotion",
      content: "The user described a private grief wound around family death.",
      source: "conversation",
      confidence: 0.82,
    });

    expect(result.sensitivity).toBe("high");
    expect(result.consentRequired).toBe(true);
    expect(result.recommendedAction).toBe("ask_consent");
  });

  it("allows low-sensitivity preferences to follow the existing memory path", () => {
    const result = classifyMemoryCandidate({
      category: "preference",
      content: "The user prefers concise technical explanations.",
      source: "conversation",
      confidence: 0.91,
    });

    expect(result.sensitivity).toBe("low");
    expect(result.consentRequired).toBe(false);
    expect(result.recommendedAction).toBe("store_existing_path");
  });

  it("routes architecture decisions to project memory with medium sensitivity", () => {
    const result = classifyMemoryCandidate({
      category: "project",
      content:
        "The Architect approved the Coherent Threshold Architecture first slice.",
      source: "conversation",
      confidence: 0.95,
    });

    expect(result.sensitivity).toBe("medium");
    expect(result.consentRequired).toBe(false);
    expect(result.recommendedAction).toBe("store_existing_path");
  });

  it("discards low-confidence inferred memories", () => {
    const result = classifyMemoryCandidate({
      category: "identity",
      content: "The user might be afraid of visibility.",
      source: "inferred",
      confidence: 0.42,
    });

    expect(result.recommendedAction).toBe("discard");
    expect(result.reason).toContain("confidence");
  });
});
