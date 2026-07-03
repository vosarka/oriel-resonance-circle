import type { MemoryCategory } from "./oriel-memory";

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
export type MemoryRecommendedAction = "store" | "pending" | "discard";

export interface MemoryCandidateInput {
  category: MemoryCandidateCategory | string;
  content: string;
  source: MemoryCandidateSource;
  confidence: number;
  importance?: number;
}

export interface MemoryConsecrationDecision {
  normalizedCategory: MemoryCategory;
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

export function mapMemoryCandidateCategory(
  category: MemoryCandidateCategory | string
): MemoryCategory {
  switch (category.toLowerCase()) {
    case "identity":
    case "preference":
    case "pattern":
    case "fact":
    case "relationship":
    case "context":
      return category.toLowerCase() as MemoryCategory;
    case "emotion":
      return "pattern";
    case "project":
    case "spiritual":
    default:
      return "context";
  }
}

function inferSensitivity(input: MemoryCandidateInput): MemorySensitivity {
  const category = input.category.toLowerCase();
  const content = input.content.toLowerCase();

  if (
    category === "emotion" ||
    category === "identity" ||
    category === "spiritual" ||
    HIGH_SENSITIVITY_TERMS.some(term => content.includes(term))
  ) {
    return "high";
  }

  if (category === "pattern" || category === "project") {
    return "medium";
  }

  return "low";
}

export function classifyMemoryCandidate(
  input: MemoryCandidateInput
): MemoryConsecrationDecision {
  const confidence = Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0.6) {
    return {
      normalizedCategory: mapMemoryCandidateCategory(input.category),
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
    normalizedCategory: mapMemoryCandidateCategory(input.category),
    sensitivity,
    consentRequired,
    recommendedAction: consentRequired ? "pending" : "store",
    reason: consentRequired
      ? "Sensitive or inferred memory requires explicit user consent before storage."
      : "Low or medium sensitivity memory can use the existing memory path.",
  };
}
