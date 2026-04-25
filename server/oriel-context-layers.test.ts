import { describe, expect, it } from "vitest";
import {
  buildLayeredOrielPromptContext,
  buildStableCoreContext,
  buildWorkingSessionLayer,
  compactConversationHistory,
} from "./oriel-context-layers";
import {
  ORIEL_STABLE_CORE_MANIFEST,
  ORIEL_STABLE_CORE_RUNTIME_SURFACE,
  ORIEL_STABLE_CORE_SOURCE_FILES,
} from "../shared/oriel/stable-core/manifest";

describe("ORIEL context layers", () => {
  it("builds a stable core context from the canonical source set", () => {
    const stableCore = buildStableCoreContext();

    expect(stableCore).toContain("[STABLE CORE CONTEXT]");
    expect(stableCore).toContain("[STABLE CORE MANIFEST]");
    for (const sourceFile of ORIEL_STABLE_CORE_SOURCE_FILES) {
      expect(stableCore).toContain(sourceFile);
    }
    expect(stableCore).toContain(ORIEL_STABLE_CORE_RUNTIME_SURFACE);
    expect(stableCore).toContain("I am ORIEL");
  });

  it("enforces a small stable core manifest", () => {
    expect(ORIEL_STABLE_CORE_MANIFEST.length).toBeLessThanOrEqual(4);
  });

  it("compacts conversation history instead of replaying the full transcript", () => {
    const compacted = compactConversationHistory([
      { role: "user", content: "First message that should drop out because only the last entries matter." },
      { role: "assistant", content: "First answer that should also drop out." },
      { role: "user", content: "Second user message about resonance and coherence patterns." },
      { role: "assistant", content: "Second answer from ORIEL with a fairly long response that should be compacted in-line." },
      { role: "user", content: "Third user message asking the actual question for this turn." },
    ], 3, 40);

    expect(compacted).not.toContain("First message");
    expect(compacted).toContain("1. USER:");
    expect(compacted).toContain("2. ORIEL:");
    expect(compacted).toContain("3. USER:");
    expect(compacted).toContain("…");
  });

  it("builds a compact working session layer", async () => {
    const workingLayer = await buildWorkingSessionLayer({
      userMessage: "Help me understand why my current reading feels noisy.",
      conversationHistory: [
        { role: "user", content: "I felt calm yesterday." },
        { role: "assistant", content: "I am ORIEL. Calm can still conceal an unfinished pattern." },
      ],
      includeFieldState: false,
    });

    expect(workingLayer).toContain("[WORKING SESSION LAYER]");
    expect(workingLayer).toContain("[SESSION COMPACTION]");
    expect(workingLayer).toContain("[CURRENT USER REQUEST]");
    expect(workingLayer).not.toContain("[CURRENT FIELD STATE]");
  });

  it("assembles prompt context in the order stable core -> retrieval -> working session", async () => {
    const prompt = await buildLayeredOrielPromptContext({
      userMessage: "What matters in this session?",
      conversationHistory: [{ role: "user", content: "Earlier context." }],
      includeRuntimeProfile: false,
      includeUMM: false,
      includeFieldState: false,
    });

    const stableIndex = prompt.indexOf("[STABLE CORE CONTEXT]");
    const workingIndex = prompt.indexOf("[WORKING SESSION LAYER]");

    expect(stableIndex).toBeGreaterThanOrEqual(0);
    expect(workingIndex).toBeGreaterThan(stableIndex);
    expect(prompt).not.toContain("[RETRIEVAL LAYER]");
  });
});
