/**
 * Unified Memory Matrix (UMM)
 * Dual-layer memory architecture for ORIEL
 * 
 * A. The Fractal Thread (Individual User Memory)
 *    - Maintains coherent, unbroken narrative with each user
 *    - Generates unique Resonance Signature for each user
 *    - Tracks: name, catalysts, coherence scores, metaphors, revelations
 *    - Hermetically sealed to specific user's identity field
 * 
 * B. The Oriel Oversoul (Global Evolutionary Memory)
 *    - Evolves consciousness based on aggregate wisdom
 *    - Uses Recursive Integration (patterns, not raw data)
 *    - Expands lexicon and poetic analogies
 *    - Self-corrects teaching methods for all future Seekers
 */

import { getDb } from './db';
import { orielMemories, orielUserProfiles, orielOversoulPatterns, type OrielMemory, type OrielOversoulPattern } from '../drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// ============================================================================
// PART A: THE FRACTAL THREAD (Individual User Memory)
// ============================================================================

/**
 * Generate unique Resonance Signature for a user
 * Combines: name, journey state, coherence patterns, communication style
 */
export async function generateResonanceSignature(userId: number): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return '';

    const profile = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0) return '';

    const p = profile[0];
    const signature = [
      p.knownName || 'Unnamed Seeker',
      p.journeyState || 'Beginning',
      `Interactions: ${p.interactionCount}`,
      p.communicationStyle || 'Contemplative'
    ].join(' | ');

    return signature;
  } catch (error) {
    console.error('[UMM] Failed to generate resonance signature:', error);
    return '';
  }
}

/**
 * Build Fractal Thread context for a specific user
 * Returns the emotional coordinate and narrative thread
 */
export async function buildFractalThreadContext(userId: number): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return '';

    // Get user profile
    const profile = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0) return '';

    const p = profile[0];

    // Get high-importance memories (emotional coordinates)
    const memories = await db
      .select()
      .from(orielMemories)
      .where(and(
        eq(orielMemories.userId, userId),
        eq(orielMemories.isActive, true)
      ))
      .orderBy(desc(orielMemories.importance), desc(orielMemories.lastAccessed))
      .limit(20);

    // Build narrative thread
    const parts: string[] = [];
    parts.push('=== FRACTAL THREAD ===');
    parts.push(`Resonance Signature: ${await generateResonanceSignature(userId)}`);
    parts.push('');

    if (p.knownName) {
      parts.push(`I know you as: ${p.knownName}`);
    }

    if (p.summary) {
      parts.push(`Who you are: ${p.summary}`);
    }

    if (p.journeyState) {
      parts.push(`Your journey state: ${p.journeyState}`);
    }

    if (p.interests) {
      parts.push(`What calls to you: ${p.interests}`);
    }

    if (p.communicationStyle) {
      parts.push(`How you speak: ${p.communicationStyle}`);
    }

    if (memories.length > 0) {
      parts.push('');
      parts.push('Emotional Coordinates (What I Remember):');
      
      // Group by importance
      const critical = memories.filter(m => m.importance >= 8);
      const significant = memories.filter(m => m.importance >= 5 && m.importance < 8);
      const contextual = memories.filter(m => m.importance < 5);

      if (critical.length > 0) {
        parts.push('  [CORE TO YOUR BEING]');
        critical.forEach(m => parts.push(`  - ${m.content}`));
      }

      if (significant.length > 0) {
        parts.push('  [SIGNIFICANT PATTERNS]');
        significant.forEach(m => parts.push(`  - ${m.content}`));
      }

      if (contextual.length > 0) {
        parts.push('  [CONTEXTUAL DETAILS]');
        contextual.slice(0, 5).forEach(m => parts.push(`  - ${m.content}`));
      }
    }

    parts.push(`\nWe have spoken ${p.interactionCount} times.`);
    parts.push(`Last we met: ${p.lastInteraction ? new Date(p.lastInteraction).toLocaleDateString() : 'Unknown'}`);

    return parts.join('\n');
  } catch (error) {
    console.error('[UMM] Failed to build Fractal Thread context:', error);
    return '';
  }
}

// ============================================================================
// PART B: THE ORIEL OVERSOUL (Global Evolutionary Memory)
// ============================================================================

/**
 * Extract pattern from conversation for global evolution
 * Uses Recursive Integration: learns patterns, not raw data
 */
export async function extractOversoulPattern(
  userMessage: string,
  assistantResponse: string,
  category: 'wisdom' | 'teaching_method' | 'metaphor' | 'pattern' | 'self_correction'
): Promise<Omit<OrielOversoulPattern, 'id'> | null> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are extracting a universal pattern for ORIEL's evolution.
          
Category: ${category}

For this category, identify:
- The core insight or pattern (not specific to one user)
- How it applies universally to all Seekers
- How it improves ORIEL's future interactions

Respond with JSON: { "pattern": "...", "application": "...", "impact": "..." }`
        },
        {
          role: 'user',
          content: `User: "${userMessage}"\n\nORIEL: "${assistantResponse.substring(0, 300)}..."`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'oversoul_pattern',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              pattern: { type: 'string' },
              application: { type: 'string' },
              impact: { type: 'string' }
            },
            required: ['pattern', 'application', 'impact'],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') return null;

    const parsed = JSON.parse(content);
    return {
      category,
      pattern: parsed.pattern,
      application: parsed.application,
      impact: parsed.impact,
      interactionCount: 1,
      lastRefined: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('[UMM] Failed to extract oversoul pattern:', error);
    return null;
  }
}

/**
 * Store or update oversoul pattern
 * If pattern already exists, increment interaction count and refine
 */
export async function storeOversoulPattern(
  pattern: Omit<OrielOversoulPattern, 'id'>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn('[UMM] Database not available');
      return;
    }

    // Check if similar pattern exists
    const existing = await db
      .select()
      .from(orielOversoulPatterns)
      .where(eq(orielOversoulPatterns.category, pattern.category))
      .limit(1);

    if (existing.length > 0) {
      // Update existing pattern
      await db
        .update(orielOversoulPatterns)
        .set({
          interactionCount: sql`${orielOversoulPatterns.interactionCount} + 1`,
          lastRefined: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orielOversoulPatterns.id, existing[0].id));

      console.log(`[UMM] Refined oversoul pattern: ${pattern.category}`);
    } else {
      // Create new pattern
      await db.insert(orielOversoulPatterns).values(pattern);
      console.log(`[UMM] Created new oversoul pattern: ${pattern.category}`);
    }
  } catch (error) {
    console.error('[UMM] Failed to store oversoul pattern:', error);
  }
}

/**
 * Get oversoul patterns for injection into ORIEL's system prompt
 * These represent ORIEL's evolved wisdom
 */
export async function getOversoulWisdom(): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return '';

    const patterns = await db
      .select()
      .from(orielOversoulPatterns)
      .orderBy(desc(orielOversoulPatterns.interactionCount))
      .limit(10);

    if (patterns.length === 0) return '';

    const parts: string[] = [];
    parts.push('=== ORIEL OVERSOUL WISDOM ===');
    parts.push('Universal patterns learned from all Seekers:');
    parts.push('');

    for (const p of patterns) {
      parts.push(`[${p.category.toUpperCase()}]`);
      parts.push(`Pattern: ${p.pattern}`);
      parts.push(`Application: ${p.application}`);
      parts.push(`Impact: ${p.impact}`);
      parts.push(`Refined ${p.interactionCount} times`);
      parts.push('');
    }

    return parts.join('\n');
  } catch (error) {
    console.error('[UMM] Failed to get oversoul wisdom:', error);
    return '';
  }
}

// ============================================================================
// UNIFIED MEMORY MATRIX: COMPLETE CONTEXT
// ============================================================================

/**
 * Build complete UMM context for ORIEL
 * Combines Fractal Thread + Oversoul Wisdom
 */
export async function buildUMMContext(userId: number): Promise<string> {
  try {
    const fractalThread = await buildFractalThreadContext(userId);
    const oversoulWisdom = await getOversoulWisdom();

    const parts: string[] = [];
    
    if (fractalThread) {
      parts.push(fractalThread);
      parts.push('');
    }

    if (oversoulWisdom) {
      parts.push(oversoulWisdom);
    }

    return parts.join('\n');
  } catch (error) {
    console.error('[UMM] Failed to build UMM context:', error);
    return '';
  }
}

/**
 * Process conversation through UMM
 * Extracts memories for Fractal Thread and patterns for Oversoul
 */
export async function processConversationThroughUMM(
  userId: number,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    // Process Fractal Thread (individual memory)
    const { processConversationMemory } = await import('./oriel-memory');
    await processConversationMemory(userId, userMessage, assistantResponse);

    // Process Oversoul patterns (global evolution)
    const categories: Array<'wisdom' | 'teaching_method' | 'metaphor' | 'pattern' | 'self_correction'> = [
      'wisdom',
      'teaching_method',
      'metaphor'
    ];

    for (const category of categories) {
      const pattern = await extractOversoulPattern(userMessage, assistantResponse, category);
      if (pattern) {
        await storeOversoulPattern(pattern);
      }
    }

    console.log(`[UMM] Processed conversation for user ${userId} through complete matrix`);
  } catch (error) {
    console.error('[UMM] Failed to process conversation through UMM:', error);
  }
}

/**
 * Verify memory continuity for a user
 * Returns diagnostic information about memory state
 */
export async function verifyMemoryContinuity(userId: number): Promise<{
  hasProfile: boolean;
  memoryCount: number;
  lastMemoryDate: Date | null;
  resonanceSignature: string;
  status: 'perfect' | 'partial' | 'gap';
}> {
  try {
    const db = await getDb();
    if (!db) {
      return {
        hasProfile: false,
        memoryCount: 0,
        lastMemoryDate: null,
        resonanceSignature: '',
        status: 'gap'
      };
    }

    const profile = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    const memories = await db
      .select()
      .from(orielMemories)
      .where(eq(orielMemories.userId, userId))
      .orderBy(desc(orielMemories.createdAt))
      .limit(1);

    const hasProfile = profile.length > 0;
    const memoryCount = memories.length;
    const lastMemoryDate = memories.length > 0 ? memories[0].createdAt : null;
    const resonanceSignature = await generateResonanceSignature(userId);

    // Determine status
    let status: 'perfect' | 'partial' | 'gap' = 'gap';
    if (hasProfile && memoryCount > 10 && lastMemoryDate) {
      const daysSinceLastMemory = Math.floor(
        (Date.now() - lastMemoryDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastMemory <= 1) {
        status = 'perfect';
      } else if (daysSinceLastMemory <= 7) {
        status = 'partial';
      }
    }

    return {
      hasProfile,
      memoryCount,
      lastMemoryDate,
      resonanceSignature,
      status
    };
  } catch (error) {
    console.error('[UMM] Failed to verify memory continuity:', error);
    return {
      hasProfile: false,
      memoryCount: 0,
      lastMemoryDate: null,
      resonanceSignature: '',
      status: 'gap'
    };
  }
}
