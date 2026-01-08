import { generateElevenLabsSpeech, audioToDataUrl } from "./elevenlabs-tts";

/**
 * Split long text into chunks that are safe for TTS generation
 * ElevenLabs has practical limits on response time, so we chunk at sentence boundaries
 */
function chunkTextForTTS(text: string, maxChunkLength: number = 500): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  // Split by sentences (period, exclamation, question mark)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    
    // If adding this sentence would exceed limit, save current chunk and start new one
    if (currentChunk.length + trimmed.length > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmed;
    } else {
      currentChunk += (currentChunk ? " " : "") + trimmed;
    }
  }

  // Add remaining text
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate speech for potentially long text by chunking it
 * Returns a single base64 audio that concatenates all chunks
 */
export async function generateChunkedSpeech(text: string): Promise<string> {
  // For short text, just generate directly
  if (text.length < 500) {
    return generateElevenLabsSpeech(text);
  }

  console.log(`[Chunked TTS] Splitting long text (${text.length} chars) into chunks`);
  
  const chunks = chunkTextForTTS(text, 500);
  console.log(`[Chunked TTS] Generated ${chunks.length} chunks`);

  // Generate audio for each chunk
  const audioChunks: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[Chunked TTS] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
    
    try {
      const base64Audio = await generateElevenLabsSpeech(chunks[i]);
      // Convert base64 back to buffer
      const audioBuffer = Buffer.from(base64Audio, "base64");
      audioChunks.push(audioBuffer);
      
      // Small delay between API calls to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`[Chunked TTS] Failed to generate chunk ${i + 1}:`, error);
      throw error;
    }
  }

  // Concatenate all audio chunks
  const concatenatedAudio = Buffer.concat(audioChunks);
  const finalBase64 = concatenatedAudio.toString("base64");
  
  console.log(`[Chunked TTS] Final audio size: ${finalBase64.length} bytes (base64)`);
  
  return finalBase64;
}
