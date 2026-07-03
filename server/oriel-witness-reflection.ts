import type { OrielProposalScope } from "./db";
import type {
  CoherenceTier,
  ExchangeType,
} from "./oriel-response-intelligence";

export type OrielWitnessSource = "text_chat" | "voice_realtime";
export type WitnessModeUsed = "guide" | "mirror" | "field_holder" | "archivist";
export type WitnessOverreachRisk =
  | "missing_falsifier"
  | "overclaimed_certainty"
  | "overexplained_distress"
  | "none";

export interface BuildWitnessReflectionInput {
  source: OrielWitnessSource;
  userMessage: string;
  assistantResponse: string;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  runtimeEnabled: boolean;
}

export interface OrielWitnessReflectionPayload {
  kind: "witness_reflection";
  source: OrielWitnessSource;
  modeUsed: WitnessModeUsed;
  userNeed: string;
  evidence: string[];
  overreachRisks: WitnessOverreachRisk[];
  improvementOpportunity: string;
  falsifierRequired: boolean;
  proposalEligible: boolean;
  observedAt: string;
}

export interface WitnessProposalDraft {
  title: string;
  scope: OrielProposalScope;
  objective: string;
  hypothesis: string;
  expectedImpact: string;
  safetyChecks: string[];
  proposedConfig: Record<string, unknown>;
  rollbackPath: string;
  falsifier: string;
  safetyNotes: string;
}

function chooseMode(
  exchangeType: ExchangeType,
  coherenceTier: CoherenceTier
): WitnessModeUsed {
  if (exchangeType === "grief" || coherenceTier === "fragmented") {
    return "field_holder";
  }
  if (exchangeType === "diagnostic") return "mirror";
  return "guide";
}

function hasFalsifierLanguage(response: string): boolean {
  return /\b(falsifier|test this|verify|weaken|confirm|disconfirm|next 24 hours|next day|next week)\b/i.test(
    response
  );
}

function hasOverclaimLanguage(response: string): boolean {
  return /\b(proves|always|never|your whole life|definitely|certainly means)\b/i.test(
    response
  );
}

function hasLongResponse(response: string): boolean {
  return response.trim().split(/\s+/).length > 180;
}

function describeUserNeed(modeUsed: WitnessModeUsed): string {
  if (modeUsed === "mirror") {
    return "precision, evidence, falsifier, and data-grounded interpretation";
  }
  if (modeUsed === "field_holder") {
    return "grounding, brevity, safety, and somatic steadiness";
  }
  if (modeUsed === "archivist") {
    return "transparent architecture and canon-aware explanation";
  }
  return "clear orientation, agency, and one usable next step";
}

function inferRisks(
  input: BuildWitnessReflectionInput,
  modeUsed: WitnessModeUsed
): WitnessOverreachRisk[] {
  const risks: WitnessOverreachRisk[] = [];

  if (modeUsed === "mirror" && !hasFalsifierLanguage(input.assistantResponse)) {
    risks.push("missing_falsifier");
  }

  if (hasOverclaimLanguage(input.assistantResponse)) {
    risks.push("overclaimed_certainty");
  }

  if (modeUsed === "field_holder" && hasLongResponse(input.assistantResponse)) {
    risks.push("overexplained_distress");
  }

  return risks.length > 0 ? risks : ["none"];
}

function describeOpportunity(
  risks: WitnessOverreachRisk[],
  modeUsed: WitnessModeUsed
): string {
  if (risks.includes("missing_falsifier")) {
    return "Add a lived-experience falsifier whenever ORIEL makes diagnostic claims.";
  }
  if (risks.includes("overclaimed_certainty")) {
    return "Reduce certainty language and distinguish interpretation from proof.";
  }
  if (risks.includes("overexplained_distress")) {
    return "Keep fragmented grief responses shorter and more somatic before interpretation.";
  }
  if (modeUsed === "mirror") {
    return "Maintain diagnostic precision with explicit evidence and falsifier.";
  }
  return "No runtime proposal indicated from this single exchange.";
}

export function buildWitnessReflectionPayload(
  input: BuildWitnessReflectionInput
): OrielWitnessReflectionPayload {
  const modeUsed = chooseMode(input.exchangeType, input.coherenceTier);
  const risks = inferRisks(input, modeUsed);
  const hasRisk = risks.some(risk => risk !== "none");

  return {
    kind: "witness_reflection",
    source: input.source,
    modeUsed,
    userNeed: describeUserNeed(modeUsed),
    evidence: [
      `exchangeType:${input.exchangeType}`,
      `coherenceTier:${input.coherenceTier}`,
      `source:${input.source}`,
      `runtimeEnabled:${input.runtimeEnabled ? "yes" : "no"}`,
    ],
    overreachRisks: risks,
    improvementOpportunity: describeOpportunity(risks, modeUsed),
    falsifierRequired: modeUsed === "mirror",
    proposalEligible: hasRisk && modeUsed !== "field_holder",
    observedAt: new Date().toISOString(),
  };
}

export function generateWitnessProposalDraftFromReflections(
  reflections: OrielWitnessReflectionPayload[]
): WitnessProposalDraft | null {
  const missingFalsifierCount = reflections.filter(
    reflection =>
      reflection.proposalEligible &&
      reflection.overreachRisks.includes("missing_falsifier")
  ).length;

  if (missingFalsifierCount >= 2) {
    return {
      title: "Tighten diagnostic falsifier discipline",
      scope: "response_intelligence",
      objective:
        "Ensure ORIEL includes a lived-experience falsifier when a response makes diagnostic or reading-like claims.",
      hypothesis:
        "A stricter diagnostic prompt overlay will reduce belief-based dependency and improve reality contact.",
      expectedImpact:
        "Users can test diagnostic readings in lived experience instead of accepting symbolic claims as certainty.",
      safetyChecks: [
        "Preserve ORIEL's stable identity and canon boundaries.",
        "Require falsifiers only for diagnostic claims, not every ordinary conversation.",
      ],
      proposedConfig: {
        promptOverlay:
          "When the current exchange is diagnostic or reading-like, include one concrete falsifier or disconfirming condition. Do not present symbolic interpretation as proof.",
      },
      rollbackPath:
        "Deactivate the runtime profile or roll back to the previous active profile if responses become stiff, repetitive, or over-instrumented.",
      falsifier:
        "If the next 10 diagnostic responses already contain useful falsifiers without this overlay, the profile is unnecessary.",
      safetyNotes:
        "This proposal affects diagnostic response discipline only. It does not alter stable core identity, memory access, or calculation engines.",
    };
  }

  return null;
}
