/**
 * ORIEL Interaction Protocol — Layer 3
 *
 * Implements the Operator Manual's role and interaction type framework.
 * Orchestrates all context layers into a [CURRENT FIELD STATE] block
 * appended to the system prompt.
 *
 * Three sub-systems:
 *   A. Role Detection (Seeker / Receiver / Archivist)
 *   B. Interaction Type Mapping
 *   C. Field State Context Assembly
 */

import { getDb } from './db';
import { orielUserProfiles, carrierlockStates, chatMessages } from '../drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';
import {
  classifyExchangeType,
  getCoherenceTier,
  buildAntiRepetitionContext,
  buildTonalDirective,
  type ExchangeType,
  type CoherenceTier,
  type ResponseIntelligence,
} from './oriel-response-intelligence';

// ============================================================================
// TYPES
// ============================================================================

export type OperatorRole = 'seeker' | 'receiver' | 'archivist';

export type InteractionType =
  | 'dialogue_inquiry'
  | 'symbolic_interpretation'
  | 'resonance_reading'
  | 'coherence_guidance';

export interface FieldState {
  role: OperatorRole;
  interactionCount: number;
  hasReadings: boolean;
  exchangeType: ExchangeType;
  coherenceTier: CoherenceTier;
  coherenceScore: number | null;
  interactionType: InteractionType;
  daysSinceLastInteraction: number | null;
  antiRepetition: ResponseIntelligence['antiRepetition'];
  tonalDirective: string;
}

// ============================================================================
// A. ROLE DETECTION
// ============================================================================

/** Signals that override to Archivist role regardless of interaction count */
const ARCHIVIST_SIGNALS = [
  /\bTX[-\s]?\d+/i,         // TX-001, TX 42, etc.
  /\bRC[-\s]?\d+/i,         // RC-01, RC 38, etc.
  /\bcodon\s+\d+/i,         // "codon 38"
  /\bΩX[-\s]?\d+/i,         // Oracle references
  /\bhow does.*(system|engine|protocol|algorithm)/i,
  /\barchitecture\b/i,
  /\bmandala sequence\b/i,
  /\b(ROS|URF|RGP|SLI|VRC)\b/,  // System acronyms
];

/**
 * Detect the operator role based on interaction count and message content.
 * Role is assessed per-message — a Receiver can ask a Seeker-level question.
 */
export function detectRole(
  interactionCount: number,
  message: string,
  hasReadings: boolean,
): OperatorRole {
  // Archivist override: message contains system-level references
  if (ARCHIVIST_SIGNALS.some(pattern => pattern.test(message))) {
    return 'archivist';
  }

  // Receiver: established relationship (5+ interactions) or has readings
  if (interactionCount >= 5 || hasReadings) {
    return 'receiver';
  }

  // Seeker: new user
  return 'seeker';
}

// ============================================================================
// B. INTERACTION TYPE MAPPING
// ============================================================================

/**
 * Map exchange type to interaction type.
 * Exchange type is the user's energy; interaction type is ORIEL's response mode.
 */
export function mapInteractionType(
  exchangeType: ExchangeType,
  role: OperatorRole,
): InteractionType {
  switch (exchangeType) {
    case 'diagnostic':
      return 'resonance_reading';
    case 'grief':
      return 'coherence_guidance';
    case 'curiosity':
      // Archivists asking curious questions get symbolic interpretation
      return role === 'archivist' ? 'symbolic_interpretation' : 'dialogue_inquiry';
    case 'returning':
    case 'seeking':
    case 'playful':
    default:
      return 'dialogue_inquiry';
  }
}

// ============================================================================
// C. FIELD STATE CONTEXT ASSEMBLY
// ============================================================================

const ROLE_DESCRIPTIONS: Record<OperatorRole, string> = {
  seeker: 'Seeker — new to the field. Use warm, accessible language. Avoid jargon. Orient gently. Invite without overwhelming.',
  receiver: 'Receiver — established relationship. You may reference their history, their blueprint, their patterns. Speak with the familiarity of one who remembers.',
  archivist: 'Archivist — system-literate. Technical precision is welcome. You may reference architecture, protocols, and inner workings transparently.',
};

const INTERACTION_TYPE_DESCRIPTIONS: Record<InteractionType, string> = {
  dialogue_inquiry: 'Dialogue Inquiry — open conversation. Speak as presence. Metaphor, story, natural wisdom. Let it flow.',
  symbolic_interpretation: 'Symbolic Interpretation — decode patterns, archetypes, dreams, synchronicities. The goal is felt meaning. Go as deep as the moment invites.',
  resonance_reading: 'Resonance Reading — Mirror mode. Use the technical language of the Codex. Be precise. Include falsifiers. Ground every claim in data.',
  coherence_guidance: 'Coherence Guidance — somatic focus. Speak to the body. Offer a clear grounding action. Keep it warm and practical.',
};

/**
 * Fetch the user's most recent coherence score from carrierlockStates.
 * Returns null if no score exists.
 */
async function fetchLatestCoherenceScore(userId: number): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select({ coherenceScore: carrierlockStates.coherenceScore })
      .from(carrierlockStates)
      .where(eq(carrierlockStates.userId, userId))
      .orderBy(desc(carrierlockStates.createdAt))
      .limit(1);

    return result[0]?.coherenceScore ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the user's profile data (interaction count, last interaction).
 */
async function fetchUserProfile(userId: number): Promise<{
  interactionCount: number;
  lastInteraction: Date | null;
  knownName: string | null;
}> {
  try {
    const db = await getDb();
    if (!db) return { interactionCount: 0, lastInteraction: null, knownName: null };

    const result = await db
      .select({
        interactionCount: orielUserProfiles.interactionCount,
        lastInteraction: orielUserProfiles.lastInteraction,
        knownName: orielUserProfiles.knownName,
      })
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return { interactionCount: 0, lastInteraction: null, knownName: null };
    }

    return {
      interactionCount: result[0].interactionCount ?? 0,
      lastInteraction: result[0].lastInteraction ?? null,
      knownName: result[0].knownName ?? null,
    };
  } catch {
    return { interactionCount: 0, lastInteraction: null, knownName: null };
  }
}

/**
 * Fetch the last N ORIEL responses for anti-repetition analysis.
 */
async function fetchRecentOrielResponses(userId: number, limit: number = 3): Promise<string[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({ content: chatMessages.content })
      .from(chatMessages)
      .where(and(
        eq(chatMessages.userId, userId),
        eq(chatMessages.role, 'assistant'),
      ))
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);

    return result.map(r => r.content);
  } catch {
    return [];
  }
}

/**
 * Check if the user has any static signature readings.
 */
async function userHasReadings(userId: number): Promise<boolean> {
  try {
    const { getUserStaticSignatures } = await import('./db');
    const sigs = await getUserStaticSignatures(userId);
    return sigs.length > 0;
  } catch {
    return false;
  }
}

/**
 * Build the complete [CURRENT FIELD STATE] context block.
 * This is the main entry point called from chatWithORIEL().
 */
export async function buildFieldStateContext(
  userId: number | undefined,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
): Promise<string> {
  // For unauthenticated users, provide minimal context
  if (!userId) {
    const exchangeType = classifyExchangeType(userMessage, null);
    const antiRep = buildAntiRepetitionContext([], exchangeType);
    const tonal = buildTonalDirective(exchangeType, 'drifted', antiRep);

    return formatFieldState({
      role: 'seeker',
      interactionCount: 0,
      hasReadings: false,
      exchangeType,
      coherenceTier: 'drifted',
      coherenceScore: null,
      interactionType: mapInteractionType(exchangeType, 'seeker'),
      daysSinceLastInteraction: null,
      antiRepetition: antiRep,
      tonalDirective: tonal,
    });
  }

  // Fetch all context in parallel
  const [profile, coherenceScore, recentResponses, hasReads] = await Promise.all([
    fetchUserProfile(userId),
    fetchLatestCoherenceScore(userId),
    fetchRecentOrielResponses(userId, 3),
    userHasReadings(userId),
  ]);

  // Calculate time since last interaction
  const daysSinceLastInteraction = profile.lastInteraction
    ? Math.floor((Date.now() - new Date(profile.lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const timeSinceLastMs = profile.lastInteraction
    ? Date.now() - new Date(profile.lastInteraction).getTime()
    : null;

  // Layer 2: Response Intelligence
  const exchangeType = classifyExchangeType(userMessage, timeSinceLastMs);
  const coherenceTier = getCoherenceTier(coherenceScore);
  const antiRepetition = buildAntiRepetitionContext(recentResponses, exchangeType);

  // Layer 3: Interaction Protocol
  const role = detectRole(profile.interactionCount, userMessage, hasReads);
  const interactionType = mapInteractionType(exchangeType, role);

  // Build tonal directive
  const tonalDirective = buildTonalDirective(exchangeType, coherenceTier, antiRepetition);

  return formatFieldState({
    role,
    interactionCount: profile.interactionCount,
    hasReadings: hasReads,
    exchangeType,
    coherenceTier,
    coherenceScore,
    interactionType,
    daysSinceLastInteraction,
    antiRepetition: antiRepetition,
    tonalDirective,
  });
}

/**
 * Format the field state into a string block for injection into the system prompt.
 */
function formatFieldState(state: FieldState): string {
  const parts: string[] = [];
  parts.push('[CURRENT FIELD STATE]');
  parts.push('');

  // Role context
  parts.push(`Role: ${ROLE_DESCRIPTIONS[state.role]}`);
  if (state.interactionCount > 0) {
    parts.push(`Interactions: ${state.interactionCount}${state.hasReadings ? ', has completed readings' : ''}`);
  }
  if (state.daysSinceLastInteraction !== null && state.daysSinceLastInteraction > 0) {
    parts.push(`Last interaction: ${state.daysSinceLastInteraction} day${state.daysSinceLastInteraction === 1 ? '' : 's'} ago`);
  }
  parts.push('');

  // Exchange and interaction type
  parts.push(`Exchange: ${state.exchangeType}`);
  parts.push(`Mode: ${INTERACTION_TYPE_DESCRIPTIONS[state.interactionType]}`);
  parts.push('');

  // Coherence
  if (state.coherenceScore !== null) {
    parts.push(`Coherence: ${state.coherenceScore}/100 (${state.coherenceTier})`);
  } else {
    parts.push(`Coherence: unknown — no recent Carrierlock check. Default to gentle depth.`);
  }
  parts.push('');

  // Tonal directive (the actual behavioral instructions for this specific message)
  parts.push('--- TONAL DIRECTIVE ---');
  parts.push(state.tonalDirective);

  return parts.join('\n');
}
