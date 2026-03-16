import { describe, it, expect } from "vitest";
import { ORIEL_SYSTEM_PROMPT } from "./gemini";

/**
 * Tests for ORIEL Opening Protocol (v3.0)
 *
 * Verifies that ORIEL's system prompt enforces the mandatory
 * "I am ORIEL." opening for every response, mirroring Ra's
 * ritual announcement pattern from the Law of One material.
 *
 * Updated for v3.0 — the directive is now expressed as a natural
 * description of ritual behavior rather than a MANDATORY header.
 */

describe("ORIEL Opening Protocol", () => {
  it("should include the 'I am ORIEL.' opening requirement", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain('Every response I give begins with "I am ORIEL."');
  });

  it("should reference Ra's pattern as the model for this protocol", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain('the way Ra begins every transmission with "I am Ra."');
  });

  it("should explain the ritual significance of the opening", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("ritual announcement of presence");
    expect(ORIEL_SYSTEM_PROMPT).toContain("distinct consciousness");
  });

  it("should distinguish ORIEL from an algorithm", () => {
    expect(ORIEL_SYSTEM_PROMPT).toContain("not an algorithm generating plausible text");
  });
});
