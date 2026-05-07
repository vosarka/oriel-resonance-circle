import { describe, expect, it } from "vitest";
import {
  buildCoherenceThresholdFrame,
  formatCoherenceThresholdContext,
} from "./oriel-coherence-threshold";

describe("ORIEL Coherence Threshold Gate", () => {
  it("requires grounding before interpretation for fragmented grief states", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "I feel broken and overwhelmed and I cannot breathe clearly.",
      exchangeType: "grief",
      coherenceTier: "fragmented",
      coherenceScore: 24,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("field_holder");
    expect(frame.groundingRequired).toBe(true);
    expect(frame.falsifiersRequired).toBe(false);
    expect(frame.maxComplexity).toBe("low");
    expect(frame.allowedTruthCategories).toEqual([
      "memory",
      "runtime_inference",
      "interpretation",
      "verifiable_fact",
    ]);
  });

  it("requires falsifiers for diagnostic mirror responses", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "Give me a reading on my current Carrierlock pattern.",
      exchangeType: "diagnostic",
      coherenceTier: "aligned",
      coherenceScore: 84,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("mirror");
    expect(frame.falsifiersRequired).toBe(true);
    expect(frame.groundingRequired).toBe(false);
    expect(frame.maxComplexity).toBe("high");
    expect(frame.allowedTruthCategories).toContain("canon");
    expect(frame.allowedTruthCategories).toContain("verifiable_fact");
  });

  it("allows architecture language for archivist-facing requests without diagnostic claims", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "Explain the architecture of the ORIEL memory layer.",
      exchangeType: "curiosity",
      coherenceTier: "drifted",
      coherenceScore: null,
      operatorRole: "archivist",
      hasReadings: false,
      routeSurface: "text_chat",
    });

    expect(frame.recommendedMode).toBe("archivist");
    expect(frame.falsifiersRequired).toBe(false);
    expect(frame.allowedTruthCategories).toContain("canon");
    expect(frame.allowedTruthCategories).toContain("runtime_inference");
    expect(frame.allowedTruthCategories).toContain("verifiable_fact");
  });

  it("formats a compact working-session context block", () => {
    const frame = buildCoherenceThresholdFrame({
      userMessage: "What should I test today?",
      exchangeType: "seeking",
      coherenceTier: "drifted",
      coherenceScore: 58,
      operatorRole: "receiver",
      hasReadings: true,
      routeSurface: "text_chat",
    });

    const context = formatCoherenceThresholdContext(frame);

    expect(context).toContain("[COHERENCE THRESHOLD FRAME]");
    expect(context).toContain("Recommended mode:");
    expect(context).toContain("Truth categories:");
    expect(context).toContain("Observe-only:");
  });
});
