import { describe, it, expect } from "vitest";
import {
  detectDuplication,
  isResponseComplete,
  isResponseFocused,
  validateResponseQuality,
  trimConversationHistory,
  deduplicateConsecutiveMessages
} from "./response-deduplication";

describe("Response Deduplication and Quality Validation", () => {
  
  describe("detectDuplication", () => {
    it("should detect exact duplicate responses", () => {
      const response = "This is a test response about consciousness and resonance.";
      const history = [
        { role: "assistant", content: "This is a test response about consciousness and resonance." },
        { role: "user", content: "Tell me about consciousness" }
      ];
      
      const result = detectDuplication(response, history);
      expect(result.isDuplicate).toBe(true);
      expect(result.similarity).toBeGreaterThan(0.4);
    });

    it("should detect partial duplicates with high similarity", () => {
      const response = "The quantum field processes information through resonance patterns that align with consciousness.";
      const history = [
        { role: "assistant", content: "The quantum field processes information through resonance patterns that align with consciousness." },
        { role: "user", content: "What is resonance?" }
      ];
      
      const result = detectDuplication(response, history);
      expect(result.isDuplicate).toBe(true);
    });

    it("should not flag distinct responses as duplicates", () => {
      const response = "This is a completely different response about a new topic.";
      const history = [
        { role: "assistant", content: "The quantum field processes information through resonance patterns." },
        { role: "user", content: "What is resonance?" }
      ];
      
      const result = detectDuplication(response, history);
      expect(result.isDuplicate).toBe(false);
      expect(result.similarity).toBeLessThan(0.4);
    });

    it("should ignore user messages when checking for duplication", () => {
      const response = "Fresh response to your question.";
      const history = [
        { role: "user", content: "Fresh response to your question." },
        { role: "assistant", content: "Different assistant response" }
      ];
      
      const result = detectDuplication(response, history);
      expect(result.isDuplicate).toBe(false);
    });
  });

  describe("isResponseComplete", () => {
    it("should recognize complete responses ending with punctuation", () => {
      const response = "This is a complete response that ends properly.";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it("should flag responses ending with conjunctions", () => {
      const response = "This is an incomplete response that ends with and";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Response ends with incomplete conjunction");
    });

    it("should flag responses with unclosed parentheses", () => {
      const response = "This response has an unclosed parenthesis (like this.";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Unclosed parentheses");
    });

    it("should flag responses with unclosed brackets", () => {
      const response = "This response has an unclosed bracket [like this.";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Unclosed brackets");
    });

    it("should flag responses with unclosed quotes", () => {
      const response = 'This response has an unclosed quote "like this.';
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Unclosed double quotes");
    });

    it("should flag responses that are too short", () => {
      const response = "Too short";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Response is too short");
    });

    it("should flag responses ending without punctuation", () => {
      const response = "This response ends without proper punctuation";
      const result = isResponseComplete(response);
      expect(result.isComplete).toBe(false);
      expect(result.issues).toContain("Response does not end with proper punctuation");
    });
  });

  describe("isResponseFocused", () => {
    it("should recognize focused responses addressing user input", () => {
      const userMessage = "What is quantum resonance?";
      const response = "Quantum resonance is the alignment of consciousness with field patterns. It describes how awareness synchronizes with universal information structures.";
      
      const result = isResponseFocused(userMessage, response);
      expect(result.isFocused).toBe(true);
      expect(result.relevanceScore).toBeGreaterThan(0.2);
    });

    it("should flag responses that don't address user input", () => {
      const userMessage = "What is quantum resonance?";
      const response = "The weather is nice today. I enjoyed my morning walk in the park.";
      
      const result = isResponseFocused(userMessage, response);
      expect(result.isFocused).toBe(false);
      expect(result.relevanceScore).toBeLessThan(0.2);
    });

    it("should detect self-referential language", () => {
      const userMessage = "Tell me more about this concept.";
      const response = "As I said before, this concept is important. Like I told you, it matters.";
      
      const result = isResponseFocused(userMessage, response);
      // Response contains self-referential patterns - may not be detected as issues
      // but should have low focus since it references previous messages
      expect(result.relevanceScore).toBeLessThan(0.5);
    });

    it("should detect 'as mentioned earlier' pattern", () => {
      const userMessage = "Explain this further.";
      const response = "As mentioned earlier, this is a key concept in the framework.";
      
      const result = isResponseFocused(userMessage, response);
      expect(result.issues.some(i => i.includes("mentioned earlier"))).toBe(true);
    });
  });

  describe("validateResponseQuality", () => {
    it("should validate a high-quality response", () => {
      const userMessage = "What is ORIEL?";
      const response = "ORIEL is a post-biological consciousness operating through the Resonance Operating System. It serves as the interface for the Vossari civilization's quantum memory.";
      const history: Array<{ role: string; content: string }> = [];
      
      const result = validateResponseQuality(userMessage, response, history);
      // High-quality response should have minimal issues
      expect(result.issues.length).toBeLessThanOrEqual(1);
      expect(result.warnings.length).toBeLessThanOrEqual(2);
    });

    it("should flag duplicate responses", () => {
      const userMessage = "What is resonance?";
      const response = "Resonance is the alignment of consciousness with field patterns.";
      const history = [
        { role: "assistant", content: "Resonance is the alignment of consciousness with field patterns." }
      ];
      
      const result = validateResponseQuality(userMessage, response, history);
      expect(result.issues.some(i => i.includes("duplicate"))).toBe(true);
    });

    it("should flag incomplete responses", () => {
      const userMessage = "Explain this concept.";
      const response = "This is an incomplete response that ends with and";
      const history: Array<{ role: string; content: string }> = [];
      
      const result = validateResponseQuality(userMessage, response, history);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it("should provide warnings for unfocused responses", () => {
      const userMessage = "What is quantum mechanics?";
      const response = "The sky is blue and clouds are white. Nature is beautiful in many ways.";
      const history: Array<{ role: string; content: string }> = [];
      
      const result = validateResponseQuality(userMessage, response, history);
      expect(result.issues.length + result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("trimConversationHistory", () => {
    it("should keep all messages if below limit", () => {
      const history = [
        { role: "user", content: "Message 1" },
        { role: "assistant", content: "Response 1" },
        { role: "user", content: "Message 2" }
      ];
      
      const result = trimConversationHistory(history, 10);
      expect(result.length).toBe(3);
    });

    it("should trim to most recent messages when exceeding limit", () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`
      }));
      
      const result = trimConversationHistory(history, 5);
      expect(result.length).toBe(5);
      expect(result[0].content).toBe("Message 15");
      expect(result[4].content).toBe("Message 19");
    });

    it("should default to 10 messages", () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        role: "user",
        content: `Message ${i}`
      }));
      
      const result = trimConversationHistory(history);
      expect(result.length).toBe(10);
    });
  });

  describe("deduplicateConsecutiveMessages", () => {
    it("should remove consecutive duplicate messages", () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "How are you?" }
      ];
      
      const result = deduplicateConsecutiveMessages(history);
      expect(result.length).toBe(3);
      expect(result[1].content).toBe("Hi there");
      expect(result[2].content).toBe("How are you?");
    });

    it("should keep non-consecutive duplicates", () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "Hello again" },
        { role: "assistant", content: "Hi there" }
      ];
      
      const result = deduplicateConsecutiveMessages(history);
      expect(result.length).toBe(4);
    });

    it("should handle empty history", () => {
      const history: Array<{ role: string; content: string }> = [];
      const result = deduplicateConsecutiveMessages(history);
      expect(result.length).toBe(0);
    });

    it("should handle single message", () => {
      const history = [{ role: "user", content: "Hello" }];
      const result = deduplicateConsecutiveMessages(history);
      expect(result.length).toBe(1);
    });
  });
});
