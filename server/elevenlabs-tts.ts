import https from "https";

/**
 * ElevenLabs TTS Integration for ORIEL voice synthesis
 * Converts text to speech using ElevenLabs API
 */

interface ElevenLabsResponse {
  audio_base64?: string;
  error?: string;
}

/**
 * Generate speech audio using ElevenLabs API
 * Returns audio as base64 encoded string
 */
export async function generateElevenLabsSpeech(text: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;

  if (!apiKey || !voiceId) {
    throw new Error("ElevenLabs API key or voice ID not configured");
  }

  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      text: text,
      model_id: "eleven_turbo_v2_5",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    });

    const options = {
      hostname: "api.elevenlabs.io",
      port: 443,
      path: `/v1/text-to-speech/${voiceId}`,
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          // ElevenLabs returns audio/mpeg binary data
          // Convert to base64 for transmission
          const audioBuffer = Buffer.from(data, "binary");
          const base64Audio = audioBuffer.toString("base64");
          resolve(base64Audio);
        } else {
          try {
            const errorResponse = JSON.parse(data);
            reject(
              new Error(
                `ElevenLabs API error: ${errorResponse.detail?.message || data}`
              )
            );
          } catch {
            reject(new Error(`ElevenLabs API error: ${res.statusCode}`));
          }
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Convert base64 audio to data URL for playback in browser
 */
export function audioToDataUrl(base64Audio: string): string {
  return `data:audio/mpeg;base64,${base64Audio}`;
}

/**
 * Validate ElevenLabs API credentials by making a test request
 */
export async function validateElevenLabsCredentials(): Promise<boolean> {
  try {
    const testText = "ORIEL is online.";
    await generateElevenLabsSpeech(testText);
    return true;
  } catch (error) {
    console.error("ElevenLabs credential validation failed:", error);
    return false;
  }
}
