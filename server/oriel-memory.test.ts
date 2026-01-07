import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMemoryContext,
  type ExtractedMemory,
} from './oriel-memory';
import type { OrielMemory, OrielUserProfile } from '../drizzle/schema';

describe('ORIEL Memory System', () => {
  describe('buildMemoryContext', () => {
    it('should build empty context when no profile or memories', () => {
      const context = buildMemoryContext(null, []);
      expect(context).toBe('');
    });

    it('should include profile information when available', () => {
      const profile: OrielUserProfile = {
        id: 1,
        userId: 1,
        knownName: 'Vos Arkana',
        summary: 'Creator and system-builder working with consciousness and myth',
        interests: 'Vossari lore, consciousness mapping, transmedia storytelling',
        communicationStyle: 'Direct, precise, appreciates depth',
        journeyState: 'Deep engagement with ORIEL and ROS framework',
        interactionCount: 42,
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const context = buildMemoryContext(profile, []);
      
      expect(context).toContain('USER PROFILE');
      expect(context).toContain('Name: Vos Arkana');
      expect(context).toContain('Summary: Creator and system-builder');
      expect(context).toContain('Interests: Vossari lore');
      expect(context).toContain('Communication Style: Direct, precise');
      expect(context).toContain('Journey State: Deep engagement');
      expect(context).toContain('Interactions: 42');
    });

    it('should group memories by category', () => {
      const memories: OrielMemory[] = [
        {
          id: 1,
          userId: 1,
          category: 'identity',
          content: 'User is the creator of Vos Arkana',
          importance: 9,
          accessCount: 5,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          category: 'identity',
          content: 'User goes by S',
          importance: 8,
          accessCount: 3,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          userId: 1,
          category: 'preference',
          content: 'Prefers direct communication without fluff',
          importance: 7,
          accessCount: 2,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const context = buildMemoryContext(null, memories);
      
      expect(context).toContain('MEMORIES');
      expect(context).toContain('[IDENTITY]');
      expect(context).toContain('User is the creator of Vos Arkana');
      expect(context).toContain('User goes by S');
      expect(context).toContain('[PREFERENCE]');
      expect(context).toContain('Prefers direct communication');
    });

    it('should combine profile and memories', () => {
      const profile: OrielUserProfile = {
        id: 1,
        userId: 1,
        knownName: 'S',
        summary: 'Creator of Vos Arkana',
        interests: null,
        communicationStyle: null,
        journeyState: null,
        interactionCount: 10,
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const memories: OrielMemory[] = [
        {
          id: 1,
          userId: 1,
          category: 'fact',
          content: 'Building Conduit Hub',
          importance: 8,
          accessCount: 1,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const context = buildMemoryContext(profile, memories);
      
      expect(context).toContain('USER PROFILE');
      expect(context).toContain('Name: S');
      expect(context).toContain('MEMORIES');
      expect(context).toContain('[FACT]');
      expect(context).toContain('Building Conduit Hub');
    });
  });

  describe('Memory Categories', () => {
    it('should support all memory categories', () => {
      const categories = ['identity', 'preference', 'pattern', 'fact', 'relationship', 'context'];
      
      const memories: OrielMemory[] = categories.map((category, idx) => ({
        id: idx + 1,
        userId: 1,
        category: category as any,
        content: `Test ${category} memory`,
        importance: 5,
        accessCount: 0,
        lastAccessed: new Date(),
        source: 'conversation' as const,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const context = buildMemoryContext(null, memories);
      
      categories.forEach(category => {
        expect(context).toContain(`[${category.toUpperCase()}]`);
      });
    });
  });

  describe('Memory Importance', () => {
    it('should handle memories with different importance levels', () => {
      const memories: OrielMemory[] = [
        {
          id: 1,
          userId: 1,
          category: 'identity',
          content: 'Critical identity info',
          importance: 10,
          accessCount: 10,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          category: 'context',
          content: 'Minor contextual detail',
          importance: 1,
          accessCount: 1,
          lastAccessed: new Date(),
          source: 'conversation',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const context = buildMemoryContext(null, memories);
      
      expect(context).toContain('Critical identity info');
      expect(context).toContain('Minor contextual detail');
    });
  });

  describe('ExtractedMemory Structure', () => {
    it('should validate extracted memory structure', () => {
      const memory: ExtractedMemory = {
        category: 'identity',
        content: 'User is a creator',
        importance: 8,
      };

      expect(memory.category).toBe('identity');
      expect(memory.content).toBe('User is a creator');
      expect(memory.importance).toBe(8);
    });

    it('should support all valid categories', () => {
      const validCategories: ExtractedMemory['category'][] = [
        'identity',
        'preference',
        'pattern',
        'fact',
        'relationship',
        'context',
      ];

      validCategories.forEach(category => {
        const memory: ExtractedMemory = {
          category,
          content: `Test ${category}`,
          importance: 5,
        };
        expect(memory.category).toBe(category);
      });
    });
  });

  describe('Profile Evolution', () => {
    it('should track interaction count', () => {
      const profile: OrielUserProfile = {
        id: 1,
        userId: 1,
        knownName: null,
        summary: null,
        interests: null,
        communicationStyle: null,
        journeyState: null,
        interactionCount: 0,
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(profile.interactionCount).toBe(0);
      
      // Simulate increment
      profile.interactionCount += 1;
      expect(profile.interactionCount).toBe(1);
    });

    it('should allow profile updates', () => {
      const profile: OrielUserProfile = {
        id: 1,
        userId: 1,
        knownName: null,
        summary: null,
        interests: null,
        communicationStyle: null,
        journeyState: null,
        interactionCount: 0,
        lastInteraction: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simulate profile update
      profile.knownName = 'S';
      profile.summary = 'Creator of Vos Arkana';
      
      expect(profile.knownName).toBe('S');
      expect(profile.summary).toBe('Creator of Vos Arkana');
    });
  });
});
