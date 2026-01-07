/**
 * Streaming Chat Utility
 * Handles response streaming with chunking for TTS compatibility
 * Splits responses exceeding 2000 chars and provides voice fallback
 */

export interface StreamChunk {
  type: 'text' | 'voice' | 'complete';
  content: string;
  chunkIndex: number;
  totalChunks: number;
  voiceAvailable: boolean;
}

const TTS_MAX_LENGTH = 2000;

/**
 * Split response into chunks suitable for TTS
 * Respects sentence boundaries when possible
 */
export function chunkResponseForTTS(response: string): string[] {
  if (response.length <= TTS_MAX_LENGTH) {
    return [response];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  const sentences = response.match(/[^.!?]+[.!?]+/g) || [response];

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    // If adding this sentence would exceed limit, save current chunk and start new one
    if ((currentChunk + trimmedSentence).length > TTS_MAX_LENGTH && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence;
    }
  }

  // Add remaining content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (e.g., no sentence boundaries), split by character limit
  if (chunks.length === 0) {
    for (let i = 0; i < response.length; i += TTS_MAX_LENGTH) {
      chunks.push(response.substring(i, i + TTS_MAX_LENGTH));
    }
  }

  return chunks.length > 0 ? chunks : [response];
}

/**
 * Stream response chunks with metadata
 * First chunk gets voice, subsequent chunks are text-only
 */
export async function* streamResponseChunks(
  response: string,
  onChunk?: (chunk: StreamChunk) => void
): AsyncGenerator<StreamChunk> {
  const chunks = chunkResponseForTTS(response);
  const totalChunks = chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const chunk: StreamChunk = {
      type: i === 0 ? 'voice' : 'text',
      content: chunks[i],
      chunkIndex: i,
      totalChunks,
      voiceAvailable: i === 0, // Only first chunk gets TTS
    };

    onChunk?.(chunk);
    yield chunk;

    // Small delay between chunks to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Send completion signal
  yield {
    type: 'complete',
    content: '',
    chunkIndex: totalChunks,
    totalChunks,
    voiceAvailable: false,
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
    .join(' ');
}
