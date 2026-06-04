import {
  INWORLD_VOICES,
  audioToDataUrl,
  generateChunkedSpeech,
} from "./inworld-tts";

export type OrielTtsVoice = "sophianic" | "deep";
export type OrielTtsProvider = "voxcpm2" | "inworld";

export interface OrielSpeechResult {
  audioUrl: string;
  provider: OrielTtsProvider;
  mimeType: string;
  cached: boolean;
}

interface VoxCpmConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
}

interface VoxCpmResponse {
  audioBase64?: unknown;
  mimeType?: unknown;
  cached?: unknown;
}

const DEFAULT_VOXCPM_TIMEOUT_MS = 600_000;

function normalizeTextForSpeech(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function resolveVoxCpmTimeoutMs(): number {
  const raw = Number(process.env.VOXCPM_TTS_TIMEOUT_MS);
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_VOXCPM_TIMEOUT_MS;
}

function getVoxCpmConfig(): VoxCpmConfig | null {
  const baseUrl = process.env.VOXCPM_TTS_URL?.trim().replace(/\/+$/, "") ?? "";
  const apiKey = process.env.VOXCPM_TTS_API_KEY?.trim() ?? "";

  if (!baseUrl && !apiKey) return null;
  if (!baseUrl) {
    throw new Error("[VoxCPM2 TTS] VOXCPM_TTS_URL is required when VOXCPM_TTS_API_KEY is set");
  }
  if (!apiKey) {
    throw new Error("[VoxCPM2 TTS] VOXCPM_TTS_API_KEY is required when VOXCPM_TTS_URL is set");
  }

  return {
    baseUrl,
    apiKey,
    timeoutMs: resolveVoxCpmTimeoutMs(),
  };
}

function toAudioDataUrl(audioBase64: string, mimeType: string): string {
  return `data:${mimeType};base64,${audioBase64}`;
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

export async function generateVoxCpmSpeechDataUrl(
  text: string,
  voice: OrielTtsVoice = "sophianic"
): Promise<OrielSpeechResult> {
  const config = getVoxCpmConfig();
  if (!config) {
    throw new Error("[VoxCPM2 TTS] VOXCPM_TTS_URL and VOXCPM_TTS_API_KEY are not configured");
  }

  const normalizedText = normalizeTextForSpeech(text);
  if (!normalizedText) {
    throw new Error("[VoxCPM2 TTS] Text is required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
  timeout.unref?.();

  try {
    const response = await fetch(`${config.baseUrl}/tts`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: normalizedText, voice }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await readErrorBody(response);
      throw new Error(
        `[VoxCPM2 TTS] HTTP ${response.status}${body ? `: ${body}` : ""}`
      );
    }

    const json = (await response.json()) as VoxCpmResponse;
    if (typeof json.audioBase64 !== "string" || !json.audioBase64) {
      throw new Error("[VoxCPM2 TTS] Response missing audioBase64");
    }

    const mimeType =
      typeof json.mimeType === "string" && json.mimeType.trim()
        ? json.mimeType
        : "audio/wav";

    return {
      audioUrl: toAudioDataUrl(json.audioBase64, mimeType),
      provider: "voxcpm2",
      mimeType,
      cached: json.cached === true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateInworldSpeechDataUrl(
  text: string,
  voice: OrielTtsVoice = "sophianic"
): Promise<OrielSpeechResult> {
  const inworldVoice = voice === "deep" ? INWORLD_VOICES.deep : INWORLD_VOICES.sophianic;
  const audioBase64 = await generateChunkedSpeech(text, inworldVoice);
  return {
    audioUrl: audioToDataUrl(audioBase64),
    provider: "inworld",
    mimeType: "audio/mpeg",
    cached: false,
  };
}

export async function generateOrielSpeechDataUrl(
  text: string,
  voice: OrielTtsVoice = "sophianic"
): Promise<OrielSpeechResult> {
  const config = getVoxCpmConfig();
  if (config) {
    return generateVoxCpmSpeechDataUrl(text, voice);
  }
  return generateInworldSpeechDataUrl(text, voice);
}
