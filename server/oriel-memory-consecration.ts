export type MemoryCandidateCategory =
  | "preference"
  | "fact"
  | "pattern"
  | "emotion"
  | "identity"
  | "spiritual"
  | "project";

export type MemoryCandidateSource = "conversation" | "explicit" | "inferred";
export type MemorySensitivity = "low" | "medium" | "high";
export type MemoryRecommendedAction =
  | "store_existing_path"
  | "ask_consent"
  | "discard";

export interface MemoryCandidateInput {
  category: MemoryCandidateCategory | string;
  content: string;
  source: MemoryCandidateSource;
  confidence: number;
}

export interface MemoryConsecrationDecision {
  sensitivity: MemorySensitivity;
  consentRequired: boolean;
  recommendedAction: MemoryRecommendedAction;
  reason: string;
}

const HIGH_SENSITIVITY_TERMS = [
  "abuse",
  "death",
  "dying",
  "grief",
  "trauma",
  "wound",
  "shame",
  "suicide",
  "self-harm",
  "private",
  "secret",
];

function inferSensitivity(input: MemoryCandidateInput): MemorySensitivity {
  const category = input.category.toLowerCase();
  const content = input.content.toLowerCase();

  if (
    category === "emotion" ||
    category === "identity" ||
    category === "spiritual" ||
    HIGH_SENSITIVITY_TERMS.some((term) => content.includes(term))
  ) {
    return "high";
  }

  if (category === "pattern" || category === "project") {
    return "medium";
  }

  return "low";
}

export function classifyMemoryCandidate(
  input: MemoryCandidateInput,
): MemoryConsecrationDecision {
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0.6) {
    return {
      sensitivity: inferSensitivity(input),
      consentRequired: false,
      recommendedAction: "discard",
      reason:
        "Discarded because memory confidence is below the storage threshold.",
    };
  }

  const sensitivity = inferSensitivity(input);
  const consentRequired = sensitivity === "high" || input.source === "inferred";

  return {
    sensitivity,
    consentRequired,
    recommendedAction: consentRequired ? "ask_consent" : "store_existing_path",
    reason: consentRequired
      ? "Sensitive or inferred memory requires explicit user consent before storage."
      : "Low or medium sensitivity memory can use the existing memory path.",
  };
}
