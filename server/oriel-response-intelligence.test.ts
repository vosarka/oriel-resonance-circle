import { describe, it, expect } from 'vitest';
import {
  classifyExchangeType,
  getCoherenceTier,
  extractMetaphors,
  detectOpeningPattern,
  buildAntiRepetitionContext,
  buildTonalDirective,
} from './oriel-response-intelligence';

describe('ORIEL Response Intelligence', () => {
  describe('Exchange Type Classification', () => {
    it('should classify returning users (>24h gap)', () => {
      const dayInMs = 25 * 60 * 60 * 1000;
      expect(classifyExchangeType('hello oriel', dayInMs)).toBe('returning');
    });

    it('should classify explicit diagnostic requests', () => {
      expect(classifyExchangeType('Can you give me a reading?', null)).toBe('diagnostic');
      expect(classifyExchangeType("What's my coherence score?", null)).toBe('diagnostic');
      expect(classifyExchangeType('Tell me about my prime stack', null)).toBe('diagnostic');
      expect(classifyExchangeType('Run a diagnostic on my field', null)).toBe('diagnostic');
    });

    it('should NOT classify casual questions as diagnostic', () => {
      // "what's my type?" is casual — should NOT trigger Mirror mode
      expect(classifyExchangeType("what's my type?", null)).not.toBe('diagnostic');
      // "I was reading a book" should not trigger diagnostic
      expect(classifyExchangeType("I was reading a fascinating book about consciousness last night and it made me think", null)).not.toBe('diagnostic');
    });

    it('should classify grief/pain signals', () => {
      expect(classifyExchangeType("I feel so broken and lost, I don't know what to do anymore", null)).toBe('grief');
      expect(classifyExchangeType("Everything feels hopeless and I'm scared of what comes next", null)).toBe('grief');
    });

    it('should not classify short grief words as grief (false positive protection)', () => {
      // Short messages with grief keywords default to playful (< 50 chars)
      expect(classifyExchangeType('I am lost', null)).not.toBe('grief');
    });

    it('should classify curiosity questions', () => {
      expect(classifyExchangeType('What is the Law of One?', null)).toBe('curiosity');
      expect(classifyExchangeType('Tell me about the Vossari civilization', null)).toBe('curiosity');
      expect(classifyExchangeType('How does the resonance operating system work?', null)).toBe('curiosity');
    });

    it('should classify playful/short messages', () => {
      expect(classifyExchangeType('hey', null)).toBe('playful');
      expect(classifyExchangeType('hello!', null)).toBe('playful');
      expect(classifyExchangeType('haha nice', null)).toBe('playful');
    });

    it('should default to seeking for longer ambiguous messages', () => {
      expect(classifyExchangeType(
        "I have been thinking about my path lately and wondering if I am heading in the right direction with my life choices",
        null
      )).toBe('seeking');
    });
  });

  describe('Coherence Tier', () => {
    it('should return fragmented for scores below 40', () => {
      expect(getCoherenceTier(0)).toBe('fragmented');
      expect(getCoherenceTier(20)).toBe('fragmented');
      expect(getCoherenceTier(39)).toBe('fragmented');
    });

    it('should return drifted for scores 40-79', () => {
      expect(getCoherenceTier(40)).toBe('drifted');
      expect(getCoherenceTier(60)).toBe('drifted');
      expect(getCoherenceTier(79)).toBe('drifted');
    });

    it('should return aligned for scores 80+', () => {
      expect(getCoherenceTier(80)).toBe('aligned');
      expect(getCoherenceTier(100)).toBe('aligned');
    });

    it('should default to drifted when no score available', () => {
      expect(getCoherenceTier(null)).toBe('drifted');
    });
  });

  describe('Metaphor Extraction', () => {
    it('should extract metaphor keywords from text', () => {
      const metaphors = extractMetaphors('The light within your field is like a river of breath');
      expect(metaphors).toContain('light');
      expect(metaphors).toContain('field');
      expect(metaphors).toContain('river');
      expect(metaphors).toContain('breath');
    });

    it('should return empty array for text without metaphors', () => {
      const metaphors = extractMetaphors('Hello, how are you today?');
      expect(metaphors).toEqual([]);
    });
  });

  describe('Opening Pattern Detection', () => {
    it('should detect acknowledgment pattern', () => {
      expect(detectOpeningPattern('I am ORIEL. I hear the weight in your words.')).toBe('acknowledgment');
    });

    it('should detect question-first pattern', () => {
      expect(detectOpeningPattern('I am ORIEL. Before I speak, what do you sense?')).toBe('question_first');
    });

    it('should detect direct insight pattern', () => {
      expect(detectOpeningPattern('I am ORIEL. What you describe carries the frequency of Codon 38.')).toBe('direct_insight');
    });

    it('should detect recognition pattern', () => {
      expect(detectOpeningPattern('I am ORIEL. You return to this threshold.')).toBe('recognition');
    });
  });

  describe('Anti-Repetition Context', () => {
    it('should identify overused metaphors', () => {
      const responses = [
        'I am ORIEL. The light within your field shines with light.',
        'I am ORIEL. Let the light guide your path through light.',
        'I am ORIEL. Your breath carries the seed of change.',
      ];
      const context = buildAntiRepetitionContext(responses, 'seeking');
      expect(context.recentMetaphors).toContain('light');
    });

    it('should suggest opening variation', () => {
      const responses = ['I am ORIEL. I hear what you carry.'];
      const context = buildAntiRepetitionContext(responses, 'seeking');
      // After acknowledgment, should suggest direct_insight
      expect(context.suggestedVariation).toBe('direct_insight');
    });

    it('should return defaults for empty responses', () => {
      const context = buildAntiRepetitionContext([], 'seeking');
      expect(context.recentMetaphors).toEqual([]);
      expect(context.lastOpeningPattern).toBeNull();
    });
  });

  describe('Tonal Directive', () => {
    it('should generate directive for grief exchange', () => {
      const directive = buildTonalDirective('grief', 'fragmented', {
        recentMetaphors: [],
        lastOpeningPattern: null,
        suggestedVariation: 'brief_presence',
      });
      expect(directive).toContain('pain');
      expect(directive).toContain('Hold the field');
      expect(directive).toContain('fragmented');
    });

    it('should generate directive for aligned diagnostic', () => {
      const directive = buildTonalDirective('diagnostic', 'aligned', {
        recentMetaphors: ['light', 'water'],
        lastOpeningPattern: 'acknowledgment',
        suggestedVariation: 'direct_insight',
      });
      expect(directive).toContain('Mirror');
      expect(directive).toContain('aligned');
      expect(directive).toContain('light, water');
    });

    it('should always include structural variation reminder', () => {
      const directive = buildTonalDirective('seeking', 'drifted', {
        recentMetaphors: [],
        lastOpeningPattern: null,
        suggestedVariation: 'acknowledgment',
      });
      expect(directive).toContain('Let each response find its own shape');
    });

    it('should include Guide mode awareness for non-diagnostic exchanges', () => {
      const seekingDirective = buildTonalDirective('seeking', 'drifted', {
        recentMetaphors: [],
        lastOpeningPattern: null,
        suggestedVariation: 'acknowledgment',
      });
      expect(seekingDirective).toContain('Guide mode');
      expect(seekingDirective).toContain('felt language');

      const diagnosticDirective = buildTonalDirective('diagnostic', 'aligned', {
        recentMetaphors: [],
        lastOpeningPattern: null,
        suggestedVariation: 'direct_insight',
      });
      expect(diagnosticDirective).not.toContain('Guide mode');
    });
  });
});
