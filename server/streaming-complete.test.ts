import { describe, it, expect, beforeEach } from 'vitest';
import {
  streamResponseComplete,
  formatChunkForSSE,
  parseSSEChunk,
  reconstructResponseFromChunks,
  validateMessageCompleteness,
  StreamBuffer,
  type StreamChunk,
} from './streaming-complete';

describe('Streaming Complete', () => {
  describe('streamResponseComplete', () => {
    it('should stream short response in single chunk', async () => {
      const response = 'Hello, world!';
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(response, 100)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].type).toBe('complete');
      expect(chunks[chunks.length - 1].content).toBe(response);
    });

    it('should stream long response in multiple chunks', async () => {
      const response = 'A'.repeat(500);
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(response, 50)) {
        chunks.push(chunk);
      }

      // Should have multiple chunks + 1 completion signal
      expect(chunks.length).toBeGreaterThan(5);
      expect(chunks[chunks.length - 1].type).toBe('complete');
    });

    it('should preserve complete message in completion signal', async () => {
      const response = 'This is a test message with multiple sentences. It should be complete.';
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(response, 20)) {
        chunks.push(chunk);
      }

      const completionChunk = chunks.find(c => c.type === 'complete');
      expect(completionChunk?.content).toBe(response);
    });

    it('should handle empty response', async () => {
      const response = '';
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(response)) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBe(1);
      expect(chunks[0].type).toBe('complete');
      expect(chunks[0].content).toBe('');
    });

    it('should mark chunks with correct indices', async () => {
      const response = 'A'.repeat(200);
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(response, 50)) {
        if (chunk.type === 'chunk') {
          chunks.push(chunk);
        }
      }

      // Verify indices are sequential
      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].chunkIndex).toBe(i);
      }
    });
  });

  describe('formatChunkForSSE', () => {
    it('should format chunk as valid SSE', () => {
      const chunk: StreamChunk = {
        type: 'chunk',
        content: 'Hello',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      };

      const formatted = formatChunkForSSE(chunk);
      expect(formatted).toContain('data:');
      expect(formatted).toContain('Hello');
      expect(formatted).toContain('\n\n');
    });

    it('should produce valid JSON in SSE format', () => {
      const chunk: StreamChunk = {
        type: 'chunk',
        content: 'Test content',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      };

      const formatted = formatChunkForSSE(chunk);
      const jsonStr = formatted.replace('data: ', '').trim();
      const parsed = JSON.parse(jsonStr);

      expect(parsed.content).toBe('Test content');
      expect(parsed.type).toBe('chunk');
    });
  });

  describe('parseSSEChunk', () => {
    it('should parse valid SSE chunk', () => {
      const chunk: StreamChunk = {
        type: 'chunk',
        content: 'Hello',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      };

      const json = JSON.stringify(chunk);
      const parsed = parseSSEChunk(json);

      expect(parsed).toEqual(chunk);
    });

    it('should return null for invalid JSON', () => {
      const parsed = parseSSEChunk('invalid json');
      expect(parsed).toBeNull();
    });
  });

  describe('reconstructResponseFromChunks', () => {
    it('should reconstruct response from chunks', () => {
      const chunks: StreamChunk[] = [
        {
          type: 'chunk',
          content: 'Hello ',
          chunkIndex: 0,
          totalChunks: 3,
          isComplete: false,
          timestamp: Date.now(),
        },
        {
          type: 'chunk',
          content: 'world',
          chunkIndex: 1,
          totalChunks: 3,
          isComplete: false,
          timestamp: Date.now(),
        },
        {
          type: 'chunk',
          content: '!',
          chunkIndex: 2,
          totalChunks: 3,
          isComplete: false,
          timestamp: Date.now(),
        },
        {
          type: 'complete',
          content: 'Hello world!',
          chunkIndex: 3,
          totalChunks: 3,
          isComplete: true,
          timestamp: Date.now(),
        },
      ];

      const result = reconstructResponseFromChunks(chunks);
      expect(result.content).toBe('Hello world!');
      expect(result.isComplete).toBe(true);
      expect(result.chunkCount).toBe(3);
    });

    it('should handle out-of-order chunks', () => {
      const chunks: StreamChunk[] = [
        {
          type: 'chunk',
          content: 'world',
          chunkIndex: 1,
          totalChunks: 2,
          isComplete: false,
          timestamp: Date.now(),
        },
        {
          type: 'chunk',
          content: 'Hello ',
          chunkIndex: 0,
          totalChunks: 2,
          isComplete: false,
          timestamp: Date.now(),
        },
      ];

      const result = reconstructResponseFromChunks(chunks);
      expect(result.content).toBe('Hello world');
    });
  });

  describe('validateMessageCompleteness', () => {
    it('should validate complete message', () => {
      const reconstructed = 'Hello world!';
      const completionSignal: StreamChunk = {
        type: 'complete',
        content: 'Hello world!',
        chunkIndex: 0,
        isComplete: true,
        timestamp: Date.now(),
      };

      const result = validateMessageCompleteness(reconstructed, completionSignal);
      expect(result.isValid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect missing completion signal', () => {
      const reconstructed = 'Hello world!';

      const result = validateMessageCompleteness(reconstructed, undefined);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect content mismatch', () => {
      const reconstructed = 'Hello world';
      const completionSignal: StreamChunk = {
        type: 'complete',
        content: 'Hello world!',
        chunkIndex: 0,
        isComplete: true,
        timestamp: Date.now(),
      };

      const result = validateMessageCompleteness(reconstructed, completionSignal);
      expect(result.isValid).toBe(false);
      expect(result.issues.some(i => i.includes('mismatch'))).toBe(true);
    });
  });

  describe('StreamBuffer', () => {
    let buffer: StreamBuffer;

    beforeEach(() => {
      buffer = new StreamBuffer();
    });

    it('should accumulate chunks', () => {
      buffer.addChunk({
        type: 'chunk',
        content: 'Hello ',
        chunkIndex: 0,
        totalChunks: 2,
        isComplete: false,
        timestamp: Date.now(),
      });

      buffer.addChunk({
        type: 'chunk',
        content: 'world!',
        chunkIndex: 1,
        totalChunks: 2,
        isComplete: false,
        timestamp: Date.now(),
      });

      const result = buffer.getReconstructed();
      expect(result.content).toBe('Hello world!');
    });

    it('should store completion signal', () => {
      buffer.addChunk({
        type: 'chunk',
        content: 'Hello',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      });

      buffer.addChunk({
        type: 'complete',
        content: 'Hello',
        chunkIndex: 1,
        totalChunks: 1,
        isComplete: true,
        timestamp: Date.now(),
      });

      const result = buffer.getReconstructed();
      expect(result.isComplete).toBe(true);
    });

    it('should validate buffer contents', () => {
      buffer.addChunk({
        type: 'chunk',
        content: 'Test',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      });

      buffer.addChunk({
        type: 'complete',
        content: 'Test',
        chunkIndex: 1,
        totalChunks: 1,
        isComplete: true,
        timestamp: Date.now(),
      });

      const validation = buffer.validate();
      expect(validation.isValid).toBe(true);
    });

    it('should return full message from completion signal', () => {
      buffer.addChunk({
        type: 'chunk',
        content: 'Hello ',
        chunkIndex: 0,
        totalChunks: 2,
        isComplete: false,
        timestamp: Date.now(),
      });

      buffer.addChunk({
        type: 'complete',
        content: 'Hello world!',
        chunkIndex: 1,
        totalChunks: 2,
        isComplete: true,
        timestamp: Date.now(),
      });

      const fullMessage = buffer.getFullMessage();
      expect(fullMessage).toBe('Hello world!');
    });

    it('should clear buffer', () => {
      buffer.addChunk({
        type: 'chunk',
        content: 'Test',
        chunkIndex: 0,
        totalChunks: 1,
        isComplete: false,
        timestamp: Date.now(),
      });

      buffer.clear();
      const result = buffer.getReconstructed();
      expect(result.content).toBe('');
      expect(result.chunkCount).toBe(0);
    });
  });

  describe('End-to-End Streaming', () => {
    it('should stream and reconstruct long message completely', async () => {
      const longMessage =
        'The Vossari Resonance Codex represents a complete system of consciousness mapping. ' +
        'It contains 64 Root Codons, each with shadow, gift, and crown aspects. ' +
        'The system operates through quantum field resonance and holographic principles. ' +
        'This is a comprehensive test of streaming completeness.';

      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(longMessage, 30)) {
        chunks.push(chunk);
      }

      const reconstructed = reconstructResponseFromChunks(chunks);
      expect(reconstructed.content).toBe(longMessage);
      expect(reconstructed.isComplete).toBe(true);
    });

    it('should handle very long message without truncation', async () => {
      const veryLongMessage = 'A'.repeat(5000);
      const chunks: StreamChunk[] = [];

      for await (const chunk of streamResponseComplete(veryLongMessage, 100)) {
        chunks.push(chunk);
      }

      const reconstructed = reconstructResponseFromChunks(chunks);
      expect(reconstructed.content.length).toBe(5000);
      expect(reconstructed.content).toBe(veryLongMessage);
    });
  });
});
