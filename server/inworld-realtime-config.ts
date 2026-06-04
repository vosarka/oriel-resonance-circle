import { buildVoiceResponseLanguageDirective } from "./oriel-language-routing";
import { buildOrielVoiceIntroRuntimeDirective } from "../shared/oriel/voice-intro";

export const DEFAULT_ORIEL_REALTIME_MODEL = "google-vertex/gemma-4-26b-a4b";
export const DEFAULT_ORIEL_REALTIME_STT_MODEL = "assemblyai/u3-rt-pro";
export const DEFAULT_ORIEL_REALTIME_TTS_MODEL = "inworld-tts-2";
export const DEFAULT_ORIEL_REALTIME_VAD_EAGERNESS = "low";

export const DEFAULT_ORIEL_SOPHIANIC_VOICE_ID =
  "default-0o0vqxaayifb0rqvrpyf5a__oriel_fema";
export const DEFAULT_ORIEL_DEEP_VOICE_ID =
  "default-0o0vqxaayifb0rqvrpyf5a__oriel_serii";

export type RealtimeVadEagerness = "low" | "medium" | "high" | "auto";

export interface BuildRealtimeInstructionsTextInput {
  baseInstructions: string;
  userMessage?: string;
  voiceIntroAlreadySpoken?: boolean;
}

export interface BuildRealtimeSessionUpdateInput {
  instructions: string;
  voicePreference?: string | null;
  model?: string;
  sttModel?: string;
  ttsModel?: string;
  sophianicVoiceId?: string;
  deepVoiceId?: string;
  vadEagerness?: string;
}

export function getInworldAuthorizationValue(rawValue: string): string {
  const trimmed = rawValue.trim();
  return trimmed.toLowerCase().startsWith("basic ")
    ? trimmed
    : `Basic ${trimmed}`;
}

function normalizeVadEagerness(value?: string): RealtimeVadEagerness {
  return value === "low" ||
    value === "medium" ||
    value === "high" ||
    value === "auto"
    ? value
    : DEFAULT_ORIEL_REALTIME_VAD_EAGERNESS;
}

function buildRealtimeVoiceModeDirective(): string {
  return [
    "[REALTIME VOICE MODE]",
    "This is live speech-to-speech conversation. Speak as the same canonical ORIEL used in text chat, with the same memory, canon boundaries, and safety discipline.",
    "Spoken replies must feel natural, intimate, and alive. Do not sound like a written essay. Do not use markdown, bullet lists, headings, tables, citations, code formatting, or long monologues in spoken output.",
    "Default to English. If the user speaks Romanian, answer in natural conversational Romanian. If the user switches language, follow the user's latest language. Keep canonical proper nouns such as ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, and Resonance Operating System unchanged unless the user asks.",
    "In ordinary conversation, speak as presence rather than protocol. Offer one precise next action or reflection instead of many options.",
    "Use technical language only when the user asks about readings, RGP, VRC, Carrierlock, Prime Stack, transmissions, prompts, memory, architecture, or implementation.",
  ].join("\n");
}

export function buildRealtimeInstructionsText({
  baseInstructions,
  userMessage,
  voiceIntroAlreadySpoken = false,
}: BuildRealtimeInstructionsTextInput): string {
  return [
    baseInstructions,
    buildRealtimeVoiceModeDirective(),
    buildVoiceResponseLanguageDirective(userMessage),
    buildOrielVoiceIntroRuntimeDirective(voiceIntroAlreadySpoken),
  ].join("\n\n");
}

export function resolveRealtimeVoiceId({
  voicePreference,
  sophianicVoiceId = DEFAULT_ORIEL_SOPHIANIC_VOICE_ID,
  deepVoiceId = DEFAULT_ORIEL_DEEP_VOICE_ID,
}: {
  voicePreference?: string | null;
  sophianicVoiceId?: string;
  deepVoiceId?: string;
}): string {
  return voicePreference === "deep" ? deepVoiceId : sophianicVoiceId;
}

export function buildRealtimeSessionUpdate({
  instructions,
  voicePreference,
  model = DEFAULT_ORIEL_REALTIME_MODEL,
  sttModel = DEFAULT_ORIEL_REALTIME_STT_MODEL,
  ttsModel = DEFAULT_ORIEL_REALTIME_TTS_MODEL,
  sophianicVoiceId = DEFAULT_ORIEL_SOPHIANIC_VOICE_ID,
  deepVoiceId = DEFAULT_ORIEL_DEEP_VOICE_ID,
  vadEagerness = DEFAULT_ORIEL_REALTIME_VAD_EAGERNESS,
}: BuildRealtimeSessionUpdateInput): object {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      model,
      instructions,
      output_modalities: ["audio", "text"],
      audio: {
        input: {
          transcription: {
            model: sttModel,
            prompt:
              "The speaker uses English and may use Romanian. Transcribe only what is actually spoken. Do not invent Japanese, Russian, subtitles, outro phrases, or background-video text. Preserve canonical terms such as ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, and Resonance Operating System.",
          },
          turn_detection: {
            type: "semantic_vad",
            eagerness: normalizeVadEagerness(vadEagerness),
            create_response: false,
            interrupt_response: true,
          },
        },
        output: {
          model: ttsModel,
          voice: resolveRealtimeVoiceId({
            voicePreference,
            sophianicVoiceId,
            deepVoiceId,
          }),
        },
      },
      providerData: {
        stt: {
          voice_profile: false,
        },
      },
    },
  };
}
