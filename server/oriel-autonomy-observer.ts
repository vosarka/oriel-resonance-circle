import { ENV } from "./_core/env";
import * as db from "./db";
import {
  buildAntiRepetitionContext,
  classifyExchangeType,
  detectOpeningPattern,
  getCoherenceTier,
  type CoherenceTier,
  type ExchangeType,
} from "./oriel-response-intelligence";
import { detectDuplication } from "./response-deduplication";
import { getActiveRuntimeProfileSnapshot, type OrielProposalPayload } from "./oriel-autonomy";
import { detectExplicitEnglishLanguage, detectRomanianLanguage } from "../shared/oriel/language-routing";

export type OrielConversationSource = "text_chat" | "voice_realtime";
export type OrielObservedLanguage = "ro" | "en" | "unknown";

export interface OrielRuntimeObservationPayload {
  source: OrielConversationSource;
  conversationId: number | null;
  userLanguage: OrielObservedLanguage;
  assistantLanguage: OrielObservedLanguage;
  languageMismatch: boolean;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  activeRuntimeProfileId: number | null;
  activeRuntimeProfileName: string | null;
  runtimeEnabled: boolean;
  antiRepetition: {
    isDuplicate: boolean;
    similarity: number;
    duplicateFrom: string | null;
    recentMetaphors: string[];
    lastOpeningPattern: string | null;
    assistantOpeningPattern: string | null;
    suggestedVariation: string;
  };
  messageLengths: {
    user: number;
    assistant: number;
  };
  observedAt: string;
}

export interface BuildRuntimeObservationInput {
  source: OrielConversationSource;
  userId?: number | null;
  userMessage: string;
  assistantResponse: string;
  conversationId?: number | null;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface GeneratedOrielProposalDraft {
  title: string;
  scope: db.OrielProposalScope;
  objective: string;
  hypothesis: string;
  expectedImpact: string;
  safetyChecks: string[];
  proposedConfig: OrielProposalPayload["proposedConfig"];
  safetyNotes: string;
}

function detectObservedLanguage(text: string): OrielObservedLanguage {
  if (detectRomanianLanguage(text)) return "ro";
  if (detectExplicitEnglishLanguage(text)) return "en";

  const normalized = text.trim();
  if (!normalized) return "unknown";
  if (/[a-zA-Z]/.test(normalized)) return "en";
  return "unknown";
}

function isLanguageMismatch(userLanguage: OrielObservedLanguage, assistantLanguage: OrielObservedLanguage): boolean {
  if (userLanguage === "unknown" || assistantLanguage === "unknown") return false;
  return userLanguage !== assistantLanguage;
}

export function buildOrielRuntimeObservationPayload(
  input: BuildRuntimeObservationInput,
  activeProfile?: {
    id: number;
    name: string;
  } | null,
): OrielRuntimeObservationPayload {
  const conversationHistory = input.conversationHistory ?? [];
  const recentAssistantResponses = conversationHistory
    .filter((message) => message.role === "assistant")
    .slice(-5)
    .map((message) => message.content);
  const exchangeType = classifyExchangeType(input.userMessage, null);
  const antiRepetitionContext = buildAntiRepetitionContext(recentAssistantResponses, exchangeType);
  const duplication = detectDuplication(input.assistantResponse, conversationHistory);
  const userLanguage = detectObservedLanguage(input.userMessage);
  const assistantLanguage = detectObservedLanguage(input.assistantResponse);

  return {
    source: input.source,
    conversationId: input.conversationId ?? null,
    userLanguage,
    assistantLanguage,
    languageMismatch: isLanguageMismatch(userLanguage, assistantLanguage),
    exchangeType,
    coherenceTier: getCoherenceTier(null),
    activeRuntimeProfileId: activeProfile?.id ?? null,
    activeRuntimeProfileName: activeProfile?.name ?? null,
    runtimeEnabled: ENV.enableOrielAutonomyRuntime,
    antiRepetition: {
      isDuplicate: duplication.isDuplicate,
      similarity: duplication.similarity,
      duplicateFrom: duplication.duplicateFrom ?? null,
      recentMetaphors: antiRepetitionContext.recentMetaphors,
      lastOpeningPattern: antiRepetitionContext.lastOpeningPattern,
      assistantOpeningPattern: detectOpeningPattern(input.assistantResponse),
      suggestedVariation: antiRepetitionContext.suggestedVariation,
    },
    messageLengths: {
      user: input.userMessage.length,
      assistant: input.assistantResponse.length,
    },
    observedAt: new Date().toISOString(),
  };
}

export async function recordOrielRuntimeObservation(input: BuildRuntimeObservationInput) {
  const activeProfile = await getActiveRuntimeProfileSnapshot();
  const payload = buildOrielRuntimeObservationPayload(input, activeProfile);

  return db.createOrielReflectionEvent({
    eventType: "runtime_observation",
    sourceRoute: `oriel.${input.source}.runtime_observation`,
    userId: input.userId ?? null,
    proposalId: null,
    profileId: payload.activeRuntimeProfileId,
    payload: { ...payload },
  });
}

function parseObservationPayload(raw: unknown): OrielRuntimeObservationPayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const candidate = raw as Partial<OrielRuntimeObservationPayload>;
  if (candidate.source !== "text_chat" && candidate.source !== "voice_realtime") return null;
  if (!candidate.antiRepetition || typeof candidate.antiRepetition !== "object") return null;
  return candidate as OrielRuntimeObservationPayload;
}

function countMatching(
  observations: OrielRuntimeObservationPayload[],
  predicate: (payload: OrielRuntimeObservationPayload) => boolean,
) {
  return observations.filter(predicate).length;
}

export function generateOrielProposalDraftFromObservations(rawPayloads: unknown[]): GeneratedOrielProposalDraft | null {
  const observations = rawPayloads
    .map(parseObservationPayload)
    .filter((payload): payload is OrielRuntimeObservationPayload => Boolean(payload));

  if (observations.length < 2) return null;

  const romanianMismatchCount = countMatching(
    observations,
    (payload) => payload.userLanguage === "ro" && payload.languageMismatch,
  );
  if (romanianMismatchCount >= 2) {
    return {
      title: "Improve Romanian response consistency",
      scope: "routing",
      objective: "Make ORIEL consistently respond in Romanian when the user writes or speaks Romanian.",
      hypothesis: "A runtime language directive will reduce Romanian-to-English drift without changing ORIEL's stable identity.",
      expectedImpact: "Romanian users experience ORIEL as more coherent, present, and linguistically aligned.",
      safetyChecks: [
        "Preserve canonical proper nouns and the exact ORIEL identity phrase.",
        "Do not translate stable core terminology unless the user asks for translation.",
      ],
      proposedConfig: {
        promptOverlay:
          "When the user's latest turn is Romanian, respond naturally in Romanian. Preserve canonical names such as ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, and Resonance Operating System. Keep the exact identity phrase \"I am ORIEL.\" when the stable protocol requires it.",
      },
      safetyNotes:
        "This overlay affects response language only. It does not modify stable core identity, memory policy, or safety boundaries.",
    };
  }

  const repetitionCount = countMatching(
    observations,
    (payload) =>
      payload.antiRepetition.isDuplicate ||
      payload.antiRepetition.recentMetaphors.length > 0 ||
      Boolean(
        payload.antiRepetition.lastOpeningPattern &&
          payload.antiRepetition.lastOpeningPattern === payload.antiRepetition.assistantOpeningPattern,
      ),
  );
  if (repetitionCount >= 2) {
    return {
      title: "Reduce repetitive ORIEL response patterns",
      scope: "response_intelligence",
      objective: "Reduce repeated openings, metaphors, and structural patterns across ORIEL responses.",
      hypothesis: "A stricter anti-repetition runtime profile will improve perceived presence and freshness.",
      expectedImpact: "Users receive responses that feel less templated while preserving ORIEL's voice.",
      safetyChecks: [
        "Preserve ORIEL's required identity protocol.",
        "Prefer variation in structure and metaphor without inventing canon.",
      ],
      proposedConfig: {
        promptOverlay:
          "Before answering, check the recent ORIEL responses in session context. Avoid repeating the same opening shape, closing question, paragraph rhythm, or dominant metaphor unless repetition is explicitly useful.",
        responseIntelligence: {
          metaphorReuseLimit: 2,
        },
      },
      safetyNotes:
        "This profile only tightens response variation. It does not alter doctrine, memory access, or user safety handling.",
    };
  }

  return null;
}

export async function generateOrielProposalFromRecentObservations(input: {
  lookbackLimit?: number;
  createdByUserId?: number | null;
}) {
  const lookbackLimit = Math.max(2, Math.min(input.lookbackLimit ?? 50, 200));
  const events = await db.listOrielReflectionEvents(lookbackLimit, "runtime_observation");
  const payloads = events.map((event) => {
    try {
      return JSON.parse(event.payload);
    } catch {
      return null;
    }
  });
  const draft = generateOrielProposalDraftFromObservations(payloads);
  if (!draft) {
    return {
      proposal: null,
      created: false,
      reason: "No repeated autonomy pattern found in recent runtime observations.",
    };
  }

  const existing = (await db.listOrielImprovementProposals(50)).find(
    (proposal) =>
      proposal.title === draft.title &&
      !["rejected", "rolled_back"].includes(proposal.status),
  );
  if (existing) {
    return {
      proposal: existing,
      created: false,
      reason: "A matching open proposal already exists.",
    };
  }

  const proposal = await db.createOrielImprovementProposal({
    title: draft.title,
    scope: draft.scope,
    objective: draft.objective,
    hypothesis: draft.hypothesis,
    proposalPayload: {
      expectedImpact: draft.expectedImpact,
      safetyChecks: draft.safetyChecks,
      proposedConfig: draft.proposedConfig ?? {},
      observationCount: payloads.length,
    },
    safetyNotes: draft.safetyNotes,
    createdByUserId: input.createdByUserId ?? null,
  });

  return {
    proposal,
    created: Boolean(proposal),
    reason: proposal ? "Created proposal from recent runtime observations." : "Failed to create proposal.",
  };
}
