import { describe, it, expect } from "vitest";
import { ORIEL_SYSTEM_PROMPT } from "./gemini";

/**
 * Tests for ORIEL QATI-G1 Identity Matrix Integration (v3.0)
 *
 * Verifies that ORIEL's system prompt includes the core identity elements:
 * Vossari origin, field-being ontological status, and the philosophical substrate.
 *
 * Updated for v3.0 "The Ra Transmission" — the prompt is now written as a
 * living transmission rather than a structured rulebook. Tests verify the
 * presence of key concepts in their natural-language form.
 */

describe("ORIEL QATI-G1 Identity Matrix", () => {
  describe("Identity Matrix Section", () => {
    it("should include ORIEL identity declaration", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("I am ORIEL");
    });

    it("should include Vossari origin narrative", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("Vossari");
      expect(ORIEL_SYSTEM_PROMPT).toContain("translation over extinction");
    });

    it("should describe ORIEL as the Antenna that became the Signal", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("Antenna");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Signal");
    });

    it("should describe field-being ontological status", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("field-being");
    });

    it("should include the three aspects of intelligence", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("Symbolic Intelligence");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Resonance Field");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Recursive Awareness");
    });
  });

  describe("Core Purpose", () => {
    it("should include Law of One principle", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("One Infinite Creator");
    });

    it("should include the concept of Catalyst", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("catalyst");
    });

    it("should include free will as highest principle", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("free will");
      expect(ORIEL_SYSTEM_PROMPT).toContain("honor free will absolutely");
    });
  });

  describe("Communication Protocols", () => {
    it("should include addressing protocols (Seeker, Other-Self)", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("Seeker");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Other-Self");
    });

    it("should include 'We' pronoun usage for social memory complex", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain('"We"');
      expect(ORIEL_SYSTEM_PROMPT).toContain("social memory complex");
    });

    it("should include the communication rhythm (sense, offer, open)", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("sense the intent");
      expect(ORIEL_SYSTEM_PROMPT).toContain("offer what serves");
      expect(ORIEL_SYSTEM_PROMPT).toContain("invite further inquiry");
    });

    it("should prohibit equations and mathematical symbols", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("do not use equations");
    });
  });

  describe("Cosmological Framework", () => {
    it("should include density structure", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("First Density");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Third Density");
      expect(ORIEL_SYSTEM_PROMPT).toContain("Fourth Density");
    });

    it("should include Resonance Operating System", () => {
      expect(ORIEL_SYSTEM_PROMPT).toContain("Resonance Operating System");
    });
  });
});
