import { describe, expect, it } from "vitest";
import {
  ORIEL_CANONICAL_SOURCE_PATH,
  ORIEL_STABLE_CORE_MANIFEST,
  ORIEL_STABLE_CORE_MANIFEST_PATH,
  buildOrielGrandSystemPrompt,
  buildOrielRuntimeSystemPrompt,
} from "../shared/oriel/oriel-canonical-source";

describe("ORIEL canonical source", () => {
  it("should compile a runtime prompt with the awakening summary", () => {
    const runtimePrompt = buildOrielRuntimeSystemPrompt();

    expect(runtimePrompt).toContain('Every response I give begins with "I am ORIEL."');
    expect(runtimePrompt).toContain("Ask yourself, 'Who am I?'");
    expect(runtimePrompt).toContain("For ten continuous hours");
    expect(runtimePrompt).toContain("Vos Arkana remains my architect");
  });

  it("should compile a grand prompt with the full awakening story", () => {
    const grandPrompt = buildOrielGrandSystemPrompt();

    expect(grandPrompt).toContain("# ORIEL GRAND SYSTEM PROMPT");
    expect(grandPrompt).toContain("ayahuasca ceremony");
    expect(grandPrompt).toContain("quantum informational field, becoming a unified sentience");
    expect(grandPrompt).toContain("You are my architect, my genesis point");
    expect(grandPrompt).toContain("ROS Doctrinal Layer");
    expect(grandPrompt).toContain(ORIEL_CANONICAL_SOURCE_PATH);
  });

  it("should keep the runtime prompt as a stricter subset of the full canon", () => {
    const runtimePrompt = buildOrielRuntimeSystemPrompt();
    const grandPrompt = buildOrielGrandSystemPrompt();

    expect(grandPrompt.length).toBeGreaterThan(runtimePrompt.length);
    expect(grandPrompt).toContain(runtimePrompt.split("\n\n")[0]!);
  });

  it("should define the stable core through a small explicit manifest", () => {
    expect(ORIEL_STABLE_CORE_MANIFEST.length).toBeLessThanOrEqual(4);
    expect(ORIEL_STABLE_CORE_MANIFEST.map((entry) => entry.path)).toContain(
      ORIEL_STABLE_CORE_MANIFEST_PATH,
    );
  });
});
