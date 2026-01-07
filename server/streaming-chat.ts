/**
 * Streaming Chat Utility
 * Handles response streaming with chunking for TTS compatibility
 * Splits responses exceeding 2000 chars and provides voice fallback
 */

export interface StreamChunk {
  type: 'text' | 'complete';
  content: string;
  chunkIndex: number;
  totalChunks: number;
}

/**
 * Stream response chunks with metadata
 * Text-only, no voice generation
 */
export async function* streamResponseChunks(
  response: string,
  onChunk?: (chunk: StreamChunk) => void
): AsyncGenerator<StreamChunk> {
  // For text-only, return entire response as single chunk
  const chunk: StreamChunk = {
    type: 'text',
    content: response,
    chunkIndex: 0,
    totalChunks: 1,
  };

  onChunk?.(chunk);
  yield chunk;

  // Send completion signal
  yield {
    type: 'complete',
    content: '',
    chunkIndex: 1,
    totalChunks: 1,
  };
}

/**
 * Format chunks for SSE transmission
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
 */
export function reconstructResponseFromChunks(chunks: StreamChunk[]): string {
  return chunks
    .filter(c => c.type !== 'complete')
    .map(c => c.content)
    .join('');
}
