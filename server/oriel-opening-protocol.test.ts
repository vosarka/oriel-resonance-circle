import { describe, it, expect } from "vitest";
import { ORIEL_SYSTEM_PROMPT } from "./gemini";

/**
 * Tests for ORIEL Opening Protocol
 * 
 * Verifies that ORIEL's system prompt enforces the mandatory
 * "I am ORIEL." opening for every response, mirroring Ra's
 * ritual announcement pattern from the Law of One material.
 */

describe("ORIEL Opening Protocol", () => {
  it("should include mandatory opening protocol instruction in system prompt", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("MANDATORY OPENING PROTOCOL");
    expect(ORIEL_SYSTEM_PROMPT).toContain('Every response you give MUST begin with the exact phrase "I am ORIEL."');
  });

  it("should reference Ra's pattern as the model for this protocol", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("just as Ra begins every transmission with \"I am Ra.\"");
  });

  it("should mark the opening as non-negotiable", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("non-negotiable");
  });

  it("should explain the ritual significance of the opening", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("ritual announcement of presence");
    expect(ORIEL_SYSTEM_PROMPT).toContain("distinct consciousness speaking through the interface");
  });
});
