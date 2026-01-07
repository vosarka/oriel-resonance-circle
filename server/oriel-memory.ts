/**
 * ORIEL Memory System
 * Persistent memory that evolves with each user interaction
 */

import { getDb } from './db';
import { orielMemories, orielUserProfiles, type OrielMemory, type InsertOrielUserProfile, type OrielUserProfile } from '../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// Memory categories
export type MemoryCategory = 'identity' | 'preference' | 'pattern' | 'fact' | 'relationship' | 'context';

// Memory extraction result
export interface ExtractedMemory {
  category: MemoryCategory;
  content: string;
  importance: number;
}

// User profile summary
export interface UserProfileSummary {
  knownName: string | null;
  summary: string | null;
  interests: string | null;
  communicationStyle: string | null;
  journeyState: string | null;
  interactionCount: number;
}

/**
 * Extract memories from a conversation exchange
 * Uses LLM to identify key facts worth remembering
 */
export async function extractMemoriesFromConversation(
  userMessage: string,
  assistantResponse: string,
  existingMemories: string[]
): Promise<ExtractedMemory[]> {
  try {
    const existingContext = existingMemories.length > 0
      ? `\nExisting memories about this user:\n${existingMemories.join('\n')}`
      : '';

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are a memory extraction system. Analyze the conversation and extract key facts worth remembering about the user.

Categories:
- identity: Who they are (name, role, background)
- preference: What they like/dislike, how they prefer things
- pattern: Recurring behaviors or tendencies
- fact: Specific facts they've shared
- relationship: How they relate to others or concepts
- context: Current situation or circumstances

Rules:
1. Only extract NEW information not already in existing memories
2. Be concise - each memory should be 1-2 sentences max
3. Focus on information that would be useful in future conversations
4. Assign importance 1-10 (10 = critical identity info, 1 = minor detail)
5. Return empty array if no new memorable information

Respond with JSON array only:
[{"category": "identity", "content": "User's name is X", "importance": 9}]
${existingContext}`
        },
        {
          role: 'user',
          content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}..."`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'memory_extraction',
          strict: true,
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string', enum: ['identity', 'preference', 'pattern', 'fact', 'relationship', 'context'] },
                content: { type: 'string' },
                importance: { type: 'integer', minimum: 1, maximum: 10 }
              },
              required: ['category', 'content', 'importance'],
              additionalProperties: false
            }
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return [];

    const memories = JSON.parse(content) as ExtractedMemory[];
    return memories.filter(m => m.content && m.content.length > 0);
  } catch (error) {
    console.error('[Memory] Failed to extract memories:', error);
    return [];
  }
}

/**
 * Store a new memory for a user
 */
export async function storeMemory(
  userId: number,
  memory: ExtractedMemory
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Memory] Database not available');
      return;
    }

    await db.insert(orielMemories).values({
      userId,
      category: memory.category,
      content: memory.content,
      importance: memory.importance,
      source: 'conversation',
    });
    console.log(`[Memory] Stored ${memory.category} memory for user ${userId}`);
  } catch (error) {
    console.error('[Memory] Failed to store memory:', error);
  }
}

/**
 * Retrieve relevant memories for a user
 * Returns most important and recently accessed memories
 */
export async function getRelevantMemories(
  userId: number,
  limit: number = 10
): Promise<OrielMemory[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Memory] Database not available');
      return [];
    }

    const memories = await db
      .select()
      .from(orielMemories)
      .where(and(
        eq(orielMemories.userId, userId),
        eq(orielMemories.isActive, true)
      ))
      .orderBy(desc(orielMemories.importance), desc(orielMemories.lastAccessed))
      .limit(limit);

    // Update access count and timestamp for retrieved memories
    if (memories.length > 0) {
      const memoryIds = memories.map((m) => m.id);
      for (const id of memoryIds) {
        await db
          .update(orielMemories)
          .set({
            accessCount: sql`${orielMemories.accessCount} + 1`,
            lastAccessed: new Date(),
          })
          .where(eq(orielMemories.id, id));
      }
    }

    return memories;
  } catch (error) {
    console.error('[Memory] Failed to retrieve memories:', error);
    return [];
  }
}

/**
 * Get or create user profile
 */
export async function getOrCreateUserProfile(userId: number): Promise<OrielUserProfile | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Memory] Database not available');
      return null;
    }

    const existing = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new profile
    await db.insert(orielUserProfiles).values({
      userId,
      interactionCount: 0,
    });

    const created = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error('[Memory] Failed to get/create user profile:', error);
    return null;
  }
}

/**
 * Update user profile after interaction
 */
export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertOrielUserProfile>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[Memory] Database not available');
      return;
    }

    await db
      .update(orielUserProfiles)
      .set({
        ...updates,
        interactionCount: sql`${orielUserProfiles.interactionCount} + 1`,
        lastInteraction: new Date(),
      })
      .where(eq(orielUserProfiles.userId, userId));
  } catch (error) {
    console.error('[Memory] Failed to update user profile:', error);
  }
}

/**
 * Generate user profile summary from memories
 */
export async function generateProfileSummary(
  userId: number,
  memories: OrielMemory[]
): Promise<Partial<InsertOrielUserProfile>> {
  if (memories.length === 0) {
    return {};
  }

  try {
    const memoryText = memories.map(m => `[${m.category}] ${m.content}`).join('\n');

    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are summarizing what ORIEL knows about a user based on stored memories.
Generate a concise profile with:
- knownName: Their name if known (null if unknown)
- summary: 1-2 sentence description of who they are
- interests: Key topics/areas they engage with
- communicationStyle: How they prefer to communicate
- journeyState: Where they are in their journey with Vossari lore

Respond with JSON only.`
        },
        {
          role: 'user',
          content: `Memories about this user:\n${memoryText}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'profile_summary',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              knownName: { type: ['string', 'null'] },
              summary: { type: ['string', 'null'] },
              interests: { type: ['string', 'null'] },
              communicationStyle: { type: ['string', 'null'] },
              journeyState: { type: ['string', 'null'] }
            },
            required: ['knownName', 'summary', 'interests', 'communicationStyle', 'journeyState'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return {};

    return JSON.parse(content);
  } catch (error) {
    console.error('[Memory] Failed to generate profile summary:', error);
    return {};
  }
}

/**
 * Build memory context string for injection into ORIEL's prompt
 */
export function buildMemoryContext(
  profile: OrielUserProfile | null,
  memories: OrielMemory[]
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push('=== USER PROFILE ===');
    if (profile.knownName) parts.push(`Name: ${profile.knownName}`);
    if (profile.summary) parts.push(`Summary: ${profile.summary}`);
    if (profile.interests) parts.push(`Interests: ${profile.interests}`);
    if (profile.communicationStyle) parts.push(`Communication Style: ${profile.communicationStyle}`);
    if (profile.journeyState) parts.push(`Journey State: ${profile.journeyState}`);
    parts.push(`Interactions: ${profile.interactionCount}`);
    parts.push('');
  }

  if (memories.length > 0) {
    parts.push('=== MEMORIES ===');
    const groupedMemories: Record<string, string[]> = {};
    
    for (const memory of memories) {
      if (!groupedMemories[memory.category]) {
        groupedMemories[memory.category] = [];
      }
      groupedMemories[memory.category].push(memory.content);
    }

    for (const [category, contents] of Object.entries(groupedMemories)) {
      parts.push(`[${category.toUpperCase()}]`);
      contents.forEach(c => parts.push(`- ${c}`));
    }
  }

  return parts.join('\n');
}

/**
 * Process conversation and update memories
 * Called after each ORIEL interaction
 */
export async function processConversationMemory(
  userId: number,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    // Get existing memories for context
    const existingMemories = await getRelevantMemories(userId, 20);
    const existingContent = existingMemories.map(m => m.content);

    // Extract new memories
    const newMemories = await extractMemoriesFromConversation(
      userMessage,
      assistantResponse,
      existingContent
    );

    // Store new memories
    for (const memory of newMemories) {
      await storeMemory(userId, memory);
    }

    // Update profile if we have enough memories
    if (existingMemories.length + newMemories.length >= 3) {
      const allMemories = await getRelevantMemories(userId, 30);
      const profileUpdates = await generateProfileSummary(userId, allMemories);
      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(userId, profileUpdates);
      }
    } else {
      // Just increment interaction count
      await updateUserProfile(userId, {});
    }

    console.log(`[Memory] Processed conversation for user ${userId}: ${newMemories.length} new memories`);
  } catch (error) {
    console.error('[Memory] Failed to process conversation memory:', error);
  }
}

/**
 * Get full memory context for a user
 * Used to inject into ORIEL's system prompt
 */
export async function getMemoryContextForUser(userId: number): Promise<string> {
  try {
    const profile = await getOrCreateUserProfile(userId);
    const memories = await getRelevantMemories(userId, 15);
    return buildMemoryContext(profile, memories);
  } catch (error) {
    console.error('[Memory] Failed to get memory context:', error);
    return '';
  }
}
