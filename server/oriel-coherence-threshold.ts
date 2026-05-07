import type { CoherenceTier, ExchangeType } from "./oriel-response-intelligence";
import type { OperatorRole } from "./oriel-interaction-protocol";

export type OrielRouteSurface =
  | "text_chat"
  | "voice"
  | "dynamic_reading"
  | "static_reading"
  | "architect_console";

export type OrielThresholdMode =
  | "guide"
  | "mirror"
  | "field_holder"
  | "archivist";

export type OrielTruthCategory =
  | "canon"
  | "interpretation"
  | "speculation"
  | "memory"
  | "runtime_inference"
  | "verifiable_fact";

export type OrielMaxComplexity = "low" | "medium" | "high";

export interface CoherenceThresholdInput {
  userMessage: string;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  coherenceScore: number | null;
  operatorRole: OperatorRole;
  hasReadings: boolean;
  routeSurface: OrielRouteSurface;
}

export interface CoherenceThresholdFrame {
  intent: ExchangeType;
  recommendedMode: OrielThresholdMode;
  allowedTruthCategories: OrielTruthCategory[];
  maxComplexity: OrielMaxComplexity;
  memorySensitivity: "low" | "medium" | "high";
  falsifiersRequired: boolean;
  groundingRequired: boolean;
  observeOnly: true;
  rationale: string;
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function inferMemorySensitivity(
  input: CoherenceThresholdInput,
): "low" | "medium" | "high" {
  const lower = input.userMessage.toLowerCase();
  if (
    input.exchangeType === "grief" ||
    /\b(trauma|abuse|grief|death|dying|ashamed|secret|wound|suicide|self-harm)\b/i.test(lower)
  ) {
    return "high";
  }

  if (
    input.exchangeType === "diagnostic" ||
    /\b(my path|my purpose|my identity|remember this|important to me)\b/i.test(lower)
  ) {
    return "medium";
  }

  return "low";
}

function chooseMode(input: CoherenceThresholdInput): OrielThresholdMode {
  if (input.exchangeType === "grief" || input.coherenceTier === "fragmented") {
    return "field_holder";
  }
  if (input.exchangeType === "diagnostic") return "mirror";
  if (input.operatorRole === "archivist") return "archivist";
  return "guide";
}

function allowedTruthCategories(mode: OrielThresholdMode): OrielTruthCategory[] {
  if (mode === "field_holder") {
    return ["memory", "runtime_inference", "interpretation", "verifiable_fact"];
  }

  if (mode === "mirror") {
    return [
      "canon",
      "memory",
      "runtime_inference",
      "interpretation",
      "verifiable_fact",
    ];
  }

  if (mode === "archivist") {
    return [
      "canon",
      "memory",
      "runtime_inference",
      "interpretation",
      "speculation",
      "verifiable_fact",
    ];
  }

  return [
    "canon",
    "memory",
    "runtime_inference",
    "interpretation",
    "verifiable_fact",
  ];
}

function chooseComplexity(
  input: CoherenceThresholdInput,
  mode: OrielThresholdMode,
): OrielMaxComplexity {
  if (mode === "field_holder") return "low";
  if (mode === "mirror" && input.coherenceTier === "aligned") return "high";
  if (mode === "archivist") return "high";
  return "medium";
}

export function buildCoherenceThresholdFrame(
  input: CoherenceThresholdInput,
): CoherenceThresholdFrame {
  const recommendedMode = chooseMode(input);
  const groundingRequired = recommendedMode === "field_holder";
  const falsifiersRequired = recommendedMode === "mirror";
  const memorySensitivity = inferMemorySensitivity(input);
  const maxComplexity = chooseComplexity(input, recommendedMode);
  const categories = unique(allowedTruthCategories(recommendedMode));

  return {
    intent: input.exchangeType,
    recommendedMode,
    allowedTruthCategories: categories,
    maxComplexity,
    memorySensitivity,
    falsifiersRequired,
    groundingRequired,
    observeOnly: true,
    rationale:
      recommendedMode === "field_holder"
        ? "Fragmentation or grief requires grounding before symbolic interpretation."
        : recommendedMode === "mirror"
          ? "Diagnostic requests require evidence, precision, and falsifiers."
          : recommendedMode === "archivist"
            ? "System-level requests may receive architectural transparency."
            : "Open guidance should remain clear, grounded, and non-coercive.",
  };
}

export function formatCoherenceThresholdContext(
  frame: CoherenceThresholdFrame,
): string {
  return [
    "[COHERENCE THRESHOLD FRAME]",
    "This observe-only frame guides the current response. It does not rewrite the stable core.",
    `Intent: ${frame.intent}`,
    `Recommended mode: ${frame.recommendedMode}`,
    `Truth categories: ${frame.allowedTruthCategories.join(", ")}`,
    `Max complexity: ${frame.maxComplexity}`,
    `Memory sensitivity: ${frame.memorySensitivity}`,
    `Falsifiers required: ${frame.falsifiersRequired ? "yes" : "no"}`,
    `Grounding before interpretation: ${frame.groundingRequired ? "yes" : "no"}`,
    `Observe-only: ${frame.observeOnly ? "yes" : "no"}`,
    `Rationale: ${frame.rationale}`,
  ].join("\n");
}
