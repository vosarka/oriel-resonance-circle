/**
 * Complete Response Streaming Utility
 * Guarantees full message delivery with real-time display
 * No truncation, no character limits, no partial responses
 */

export interface StreamChunk {
  type: 'chunk' | 'complete' | 'error';
  content: string;
  chunkIndex: number;
  totalChunks?: number;
  isComplete: boolean;
  timestamp: number;
}

/**
 * Stream response in chunks for real-time UI display
 * Guarantees complete message delivery
 */
export async function* streamResponseComplete(
  response: string,
  chunkSize: number = 50 // Characters per chunk for smooth display
): AsyncGenerator<StreamChunk> {
  if (!response || response.length === 0) {
    yield {
      type: 'complete',
      content: '',
      chunkIndex: 0,
      totalChunks: 1,
      isComplete: true,
      timestamp: Date.now(),
    };
    return;
  }

  // Calculate total chunks
  const totalChunks = Math.ceil(response.length / chunkSize);
  let currentIndex = 0;

  // Stream response in chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, response.length);
    const chunk = response.substring(start, end);

    yield {
      type: 'chunk',
      content: chunk,
      chunkIndex: i,
      totalChunks,
      isComplete: false,
      timestamp: Date.now(),
    };

    currentIndex = end;

    // Small delay between chunks for smooth animation
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  // Send completion signal with full message
  yield {
    type: 'complete',
    content: response, // Full message for verification
    chunkIndex: totalChunks,
    totalChunks,
    isComplete: true,
    timestamp: Date.now(),
  };
}

/**
 * Format chunk for SSE transmission
 */
export function formatChunkForSSE(chunk: StreamChunk): string {
  return `data: ${JSON.stringify(chunk)}\n\n`;
}

/**
 * Parse SSE stream on client side
 */
export function parseSSEChunk(data: string): StreamChunk | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Reconstruct full response from chunks
 * Validates completeness
 */
export function reconstructResponseFromChunks(chunks: StreamChunk[]): {
  content: string;
  isComplete: boolean;
  chunkCount: number;
} {
  const contentChunks = chunks
    .filter(c => c.type === 'chunk')
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map(c => c.content);

  const completionChunk = chunks.find(c => c.type === 'complete');
  const reconstructed = contentChunks.join('');
  const isComplete = completionChunk?.isComplete ?? false;

  return {
    content: reconstructed,
    isComplete,
    chunkCount: contentChunks.length,
  };
}

/**
 * Validate message completeness
 * Compares reconstructed message with completion signal
 */
export function validateMessageCompleteness(
  reconstructed: string,
  completionSignal: StreamChunk | undefined
): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!completionSignal) {
    issues.push('No completion signal received');
  }

  if (!completionSignal?.isComplete) {
    issues.push('Completion signal indicates incomplete message');
  }

  if (reconstructed !== completionSignal?.content) {
    issues.push(
      `Message mismatch: reconstructed ${reconstructed.length} chars vs completion signal ${completionSignal?.content.length} chars`
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Buffer for collecting streaming chunks
 */
export class StreamBuffer {
  private chunks: StreamChunk[] = [];
  private completionSignal: StreamChunk | undefined;

  addChunk(chunk: StreamChunk): void {
    if (chunk.type === 'complete') {
      this.completionSignal = chunk;
    } else {
      this.chunks.push(chunk);
    }
  }

  getReconstructed(): {
    content: string;
    isComplete: boolean;
    chunkCount: number;
  } {
    return reconstructResponseFromChunks([...this.chunks, ...(this.completionSignal ? [this.completionSignal] : [])]);
  }

  validate(): {
    isValid: boolean;
    issues: string[];
  } {
    const reconstructed = this.getReconstructed();
    return validateMessageCompleteness(reconstructed.content, this.completionSignal);
  }

  getFullMessage(): string {
    return this.completionSignal?.content ?? this.getReconstructed().content;
  }

  clear(): void {
    this.chunks = [];
    this.completionSignal = undefined;
  }
}
