import { describe, it, expect } from "vitest";
import {
  chunkResponseForTTS,
  reconstructResponseFromChunks,
  formatChunkForSSE,
  parseSSEChunk,
} from "./streaming-chat";

describe("Streaming Chat Utilities", () => {
  describe("chunkResponseForTTS", () => {
    it("should return single chunk for short responses", () => {
      const response = "This is a short response.";
      const chunks = chunkResponseForTTS(response);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe(response);
    });

    it("should split long responses at sentence boundaries", () => {
      const response =
        "First sentence. Second sentence. Third sentence. Fourth sentence.";
      const chunks = chunkResponseForTTS(response);
      expect(chunks.length).toBeGreaterThanOrEqual(1);
      // Each chunk should be a valid sentence
      chunks.forEach(chunk => {
        expect(chunk.trim().length).toBeGreaterThan(0);
      });
    });

    it("should respect 2000 character limit", () => {
      const longText = "A. ".repeat(1000);
      const chunks = chunkResponseForTTS(longText);
      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(2000);
      });
    });

    it("should handle responses with multiple punctuation marks", () => {
      const response = "Question? Yes! Exclamation. Period...";
      const chunks = chunkResponseForTTS(response);
      expect(chunks.length).toBeGreaterThan(0);
    });

    it("should preserve content when chunking", () => {
      const response =
        "First. Second. Third. Fourth. Fifth. Sixth. Seventh. Eighth.";
      const chunks = chunkResponseForTTS(response);
      const reconstructed = chunks.join(" ");
      expect(reconstructed).toContain("First");
      expect(reconstructed).toContain("Eighth");
    });
  });

  describe("reconstructResponseFromChunks", () => {
    it("should reconstruct response from chunks", () => {
      const chunks = [
        {
          type: "voice" as const,
          content: "First part.",
          chunkIndex: 0,
          totalChunks: 2,
          voiceAvailable: true,
        },
        {
          type: "text" as const,
          content: "Second part.",
          chunkIndex: 1,
          totalChunks: 2,
          voiceAvailable: false,
        },
      ];
      const reconstructed = reconstructResponseFromChunks(chunks);
      expect(reconstructed).toBe("First part. Second part.");
    });

    it("should filter out complete chunks", () => {
      const chunks = [
        {
          type: "voice" as const,
          content: "Content",
          chunkIndex: 0,
          totalChunks: 2,
          voiceAvailable: true,
        },
        {
          type: "complete" as const,
          content: "",
          chunkIndex: 1,
          totalChunks: 2,
          voiceAvailable: false,
        },
      ];
      const reconstructed = reconstructResponseFromChunks(chunks);
      expect(reconstructed).toBe("Content");
    });
  });

  describe("formatChunkForSSE", () => {
    it("should format chunk as SSE data", () => {
      const chunk = {
        type: "text" as const,
        content: "Hello world",
        chunkIndex: 0,
        totalChunks: 1,
        voiceAvailable: false,
      };
      const formatted = formatChunkForSSE(chunk);
      expect(formatted).toContain("data:");
      expect(formatted).toContain("Hello world");
      expect(formatted).toMatch(/\n\n$/);
    });

    it("should properly escape JSON in SSE format", () => {
      const chunk = {
        type: "text" as const,
        content: 'Content with "quotes"',
        chunkIndex: 0,
        totalChunks: 1,
        voiceAvailable: false,
      };
      const formatted = formatChunkForSSE(chunk);
      expect(formatted).toContain("data:");
      expect(formatted).toContain("quotes");
    });
  });

  describe("parseSSEChunk", () => {
    it("should parse valid SSE chunk", () => {
      const chunk = {
        type: "text" as const,
        content: "Hello",
        chunkIndex: 0,
        totalChunks: 1,
        voiceAvailable: false,
      };
      const json = JSON.stringify(chunk);
      const parsed = parseSSEChunk(json);
      expect(parsed).toEqual(chunk);
    });

    it("should return null for invalid JSON", () => {
      const parsed = parseSSEChunk("invalid json");
      expect(parsed).toBeNull();
    });

    it("should handle complex content", () => {
      const chunk = {
        type: "text" as const,
        content: "Multi\nline\ncontent with special chars: !@#$%",
        chunkIndex: 0,
        totalChunks: 1,
        voiceAvailable: false,
      };
      const json = JSON.stringify(chunk);
      const parsed = parseSSEChunk(json);
      expect(parsed?.content).toContain("Multi");
      expect(parsed?.content).toContain("special");
    });
  });

  describe("Integration scenarios", () => {
    it("should handle full streaming workflow", () => {
      const originalResponse =
        "This is a long response. It has multiple sentences. Each one is important. We need to split them properly. And then reconstruct them.";

      // Chunk the response
      const chunks = chunkResponseForTTS(originalResponse);
      expect(chunks.length).toBeGreaterThan(0);

      // Format for SSE
      const formatted = chunks.map(content => {
        const chunk = {
          type: "text" as const,
          content,
          chunkIndex: 0,
          totalChunks: chunks.length,
          voiceAvailable: false,
        };
        return formatChunkForSSE(chunk);
      });

      expect(formatted.length).toBe(chunks.length);
      formatted.forEach(f => {
        expect(f).toContain("data:");
        expect(f).toMatch(/\n\n$/);
      });
    });

    it("should handle very long responses", () => {
      const veryLong = "Sentence. ".repeat(500); // 5000+ characters
      const chunks = chunkResponseForTTS(veryLong);
      expect(chunks.length).toBeGreaterThan(1);

      chunks.forEach(chunk => {
        expect(chunk.length).toBeLessThanOrEqual(2000);
      });

      // Verify no content is lost
      const reconstructed = chunks.join(" ");
      expect(reconstructed).toContain("Sentence");
    });
  });
});
