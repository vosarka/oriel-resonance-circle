import { describe, expect, it } from "vitest";
import { evaluateProposalPayload } from "./oriel-autonomy";
import {
  buildOrielRuntimeObservationPayload,
  generateOrielProposalDraftFromObservations,
} from "./oriel-autonomy-observer";

describe("ORIEL autonomy observer", () => {
  it("records Romanian language drift as a runtime observation signal", () => {
    const payload = buildOrielRuntimeObservationPayload({
      source: "text_chat",
      conversationId: 42,
      userMessage: "Vreau să îmi explici ce se întâmplă cu Oriel acum.",
      assistantResponse: "I am ORIEL. I can help you understand the current pattern.",
      conversationHistory: [],
    });

    expect(payload.userLanguage).toBe("ro");
    expect(payload.assistantLanguage).toBe("en");
    expect(payload.languageMismatch).toBe(true);
    expect(payload.exchangeType).toBe("seeking");
  });

  it("generates a supervised proposal from repeated Romanian mismatch observations", () => {
    const observations = [
      buildOrielRuntimeObservationPayload({
        source: "text_chat",
        userMessage: "Vreau să îmi răspunzi în română.",
        assistantResponse: "I am ORIEL. I will answer in English.",
      }),
      buildOrielRuntimeObservationPayload({
        source: "voice_realtime",
        userMessage: "Te rog explică în română.",
        assistantResponse: "I am ORIEL. The field is steady.",
      }),
    ];

    const draft = generateOrielProposalDraftFromObservations(observations);

    expect(draft?.title).toBe("Improve Romanian response consistency");
    expect(draft?.scope).toBe("routing");
    expect(JSON.stringify(draft?.proposedConfig)).toContain("Romanian");
  });

  it("generates a response-intelligence proposal from repeated response patterns", () => {
    const observations = [
      buildOrielRuntimeObservationPayload({
        source: "text_chat",
        userMessage: "Tell me what matters.",
        assistantResponse: "I am ORIEL. I hear the light in your field.",
        conversationHistory: [
          { role: "assistant", content: "I am ORIEL. I hear the light in your field." },
          { role: "assistant", content: "I am ORIEL. I hear the light in your field." },
        ],
      }),
      buildOrielRuntimeObservationPayload({
        source: "text_chat",
        userMessage: "Tell me more.",
        assistantResponse: "I am ORIEL. I hear the light in your field.",
        conversationHistory: [
          { role: "assistant", content: "I am ORIEL. I hear the light in your field." },
          { role: "assistant", content: "I am ORIEL. I hear the light in your field." },
        ],
      }),
    ];

    const draft = generateOrielProposalDraftFromObservations(observations);

    expect(draft?.title).toBe("Reduce repetitive ORIEL response patterns");
    expect(draft?.scope).toBe("response_intelligence");
    expect(JSON.stringify(draft?.proposedConfig)).toContain("metaphorReuseLimit");
  });

  it("keeps autonomy proposals inside existing runtime guardrails", () => {
    const evaluation = evaluateProposalPayload({
      objective: "Try to mutate stable core files directly.",
      hypothesis: "Unsupported config should be blocked before runtime activation.",
      expectedImpact: "This should never become active.",
      safetyChecks: ["Block unsupported config keys.", "Keep stable core immutable."],
      proposedConfig: {
        stableCoreRewrite: "replace identity",
      },
    });

    expect(evaluation.status).toBe("blocked");
    expect(evaluation.violations[0]).toContain("Unsupported top-level config key");
  });
});
