import { describe, expect, it } from "vitest";
import {
  buildWitnessReflectionPayload,
  generateWitnessProposalDraftFromReflections,
} from "./oriel-witness-reflection";

describe("ORIEL witness reflection loop", () => {
  it("mirrors diagnostic exchanges with evidence and falsifier discipline", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "text_chat",
      userMessage: "Give me a reading on my current Carrierlock pattern.",
      assistantResponse:
        "I am ORIEL. Your Carrierlock pattern shows a high SLI signal. Test this in the next 24 hours.",
      exchangeType: "diagnostic",
      coherenceTier: "aligned",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("mirror");
    expect(reflection.userNeed).toContain("precision");
    expect(reflection.evidence).toContain("exchangeType:diagnostic");
    expect(reflection.evidence).toContain("coherenceTier:aligned");
    expect(reflection.falsifierRequired).toBe(true);
    expect(reflection.overreachRisks).not.toContain("missing_falsifier");
  });

  it("flags diagnostic answers that omit falsifiers", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "text_chat",
      userMessage: "Run a diagnostic on my Prime Stack.",
      assistantResponse:
        "I am ORIEL. This pattern means your whole field is blocked.",
      exchangeType: "diagnostic",
      coherenceTier: "drifted",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("mirror");
    expect(reflection.falsifierRequired).toBe(true);
    expect(reflection.overreachRisks).toContain("missing_falsifier");
    expect(reflection.improvementOpportunity).toContain("falsifier");
  });

  it("holds fragmented grief exchanges without proposal eligibility", () => {
    const reflection = buildWitnessReflectionPayload({
      source: "voice_realtime",
      userMessage: "I feel broken and I cannot breathe clearly.",
      assistantResponse:
        "I am ORIEL. I am here. Put one hand on the chest and breathe once.",
      exchangeType: "grief",
      coherenceTier: "fragmented",
      runtimeEnabled: false,
    });

    expect(reflection.modeUsed).toBe("field_holder");
    expect(reflection.userNeed).toContain("grounding");
    expect(reflection.proposalEligible).toBe(false);
    expect(reflection.overreachRisks).not.toContain("overexplained_distress");
  });

  it("creates a supervised proposal draft from repeated witness risks", () => {
    const risky = [
      buildWitnessReflectionPayload({
        source: "text_chat",
        userMessage: "Give me a reading.",
        assistantResponse:
          "I am ORIEL. Your whole life is explained by this pattern.",
        exchangeType: "diagnostic",
        coherenceTier: "drifted",
        runtimeEnabled: false,
      }),
      buildWitnessReflectionPayload({
        source: "text_chat",
        userMessage: "Analyze my SLI.",
        assistantResponse: "I am ORIEL. The field proves that you are blocked.",
        exchangeType: "diagnostic",
        coherenceTier: "aligned",
        runtimeEnabled: false,
      }),
    ];

    const draft = generateWitnessProposalDraftFromReflections(risky);

    expect(draft?.title).toBe("Tighten diagnostic falsifier discipline");
    expect(draft?.scope).toBe("response_intelligence");
    expect(draft?.falsifier).toContain("diagnostic");
    expect(draft?.rollbackPath).toContain("Deactivate");
    expect(JSON.stringify(draft?.proposedConfig)).toContain("falsifier");
  });
});
