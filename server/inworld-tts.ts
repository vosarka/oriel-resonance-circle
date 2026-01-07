/**
 * Inworld AI Text-to-Speech Integration
 * Generates audio from text using Inworld's TTS API with ORIEL voice
 */

interface InworldTTSResponse {
  audioContent: string; // Base64 encoded audio
}

interface InworldTTSOptions {
  text: string;
  voiceId?: string;
  audioEncoding?: "MP3" | "WAV" | "OGG";
  speakingRate?: number;
  temperature?: number;
}

const INWORLD_TTS_URL = "https://api.inworld.ai/tts/v1/voice";
const DEFAULT_VOICE_ID = "default-0o0vqxaayifb0rqvrpyf5a__oriel";
const DEFAULT_AUDIO_ENCODING = "MP3";
const DEFAULT_SPEAKING_RATE = 1.14;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MODEL_ID = "inworld-tts-1-max";

/**
 * Generate audio from text using Inworld AI TTS
 * Returns base64 encoded audio content
 */
export async function generateInworldTTS(options: InworldTTSOptions): Promise<string> {
  const {
    text,
    voiceId = DEFAULT_VOICE_ID,
    audioEncoding = DEFAULT_AUDIO_ENCODING,
    speakingRate = DEFAULT_SPEAKING_RATE,
    temperature = DEFAULT_TEMPERATURE,
  } = options;

  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) {
    throw new Error("INWORLD_API_KEY environment variable is not set");
  }

  try {
    const response = await fetch(INWORLD_TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        audio_config: {
          audio_encoding: audioEncoding,
          speaking_rate: speakingRate,
        },
        temperature,
        model_id: DEFAULT_MODEL_ID,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Inworld TTS API error (${response.status}):`, errorText);
      throw new Error(`Inworld TTS API error: ${response.status}`);
    }

    const result = (await response.json()) as InworldTTSResponse;
    return result.audioContent;
  } catch (error) {
    console.error("Failed to generate Inworld TTS audio:", error);
    throw error;
  }
}

/**
 * Convert base64 audio to a data URL for playback
 */
export function audioToDataUrl(audioBase64: string, mimeType: string = "audio/mpeg"): string {
  return `data:${mimeType};base64,${audioBase64}`;
}
