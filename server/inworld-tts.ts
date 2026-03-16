/**
 * Inworld TTS Integration for ORIEL voice synthesis
 *
 * Replaces ElevenLabs. Uses Inworld TTS API v1 with Basic auth.
 *
 * Required env var:
 *   INWORLD_API_KEY  — Base64-encoded "key_id:key_secret" credentials
 *
 * Optional env var:
 *   INWORLD_VOICE_ID — Override voice (defaults to ORIEL's configured voice)
 *
 * API: POST https://api.inworld.ai/tts/v1/voice
 * Response: { audioContent: "<base64 MP3>" }
 */

import https from 'https';

const DEFAULT_VOICE_ID = 'default-0o0vqxaayifb0rqvrpyf5a__oriel_fema';
const MODEL_ID = 'inworld-tts-1.5-max';

// ─── Core synthesis ───────────────────────────────────────────────────────────

/**
 * Generate speech using Inworld TTS API.
 * Returns base64-encoded MP3 audio.
 */
export async function generateInworldSpeech(text: string): Promise<string> {
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) throw new Error('[Inworld TTS] INWORLD_API_KEY is not configured');

  const voiceId = process.env.INWORLD_VOICE_ID ?? DEFAULT_VOICE_ID;

  const payload = JSON.stringify({ text, voiceId, modelId: MODEL_ID });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.inworld.ai',
      port: 443,
      path: '/tts/v1/voice',
      method: 'POST',
      headers: {
        Authorization:    `Basic ${apiKey}`,
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const json = JSON.parse(body) as { audioContent?: string };
            if (!json.audioContent) {
              reject(new Error('[Inworld TTS] Response missing audioContent'));
              return;
            }
            console.log(`[Inworld TTS] Generated audio: ${json.audioContent.length} chars (base64)`);
            resolve(json.audioContent);
          } catch {
            reject(new Error(`[Inworld TTS] Could not parse response: ${body.slice(0, 200)}`));
          }
        } else {
          console.error(`[Inworld TTS] API error ${res.statusCode}:`, body.slice(0, 300));
          reject(new Error(`[Inworld TTS] Error ${res.statusCode}: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Inworld TTS] Request error:', err);
      reject(err);
    });
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('[Inworld TTS] Request timeout'));
    });

    req.write(payload);
    req.end();
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert base64 audio to a browser-playable data URL. */
export function audioToDataUrl(base64Audio: string): string {
  return `data:audio/mpeg;base64,${base64Audio}`;
}

// ─── Chunked generation for long ORIEL transmissions ─────────────────────────

function chunkText(text: string, maxLength = 1000): string[] {
  const chunks: string[] = [];
  let current = '';
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (current.length + trimmed.length > maxLength && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current += (current ? ' ' : '') + trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Generate speech for long text by chunking at sentence boundaries.
 * Returns a single base64 MP3 (all chunks concatenated).
 */
export async function generateChunkedSpeech(text: string): Promise<string> {
  if (text.length < 1000) return generateInworldSpeech(text);

  console.log(`[Inworld TTS] Chunking ${text.length}-char text`);
  const chunks = chunkText(text, 1000);
  console.log(`[Inworld TTS] ${chunks.length} chunks`);

  const buffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const base64 = await generateInworldSpeech(chunks[i]);
    buffers.push(Buffer.from(base64, 'base64'));
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 150));
  }

  return Buffer.concat(buffers).toString('base64');
}
