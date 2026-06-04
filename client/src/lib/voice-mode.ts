export const VOICE_MODE_MANUAL_RESPONSE_DELAY_MS = 3000;

export function shouldVoiceModeUseRealtimeAutoResponse(): boolean {
  return false;
}

export function shouldVoiceModeRequestManualResponse(input: {
  realtimeAutoResponds: boolean;
  hasSpeechSinceLastResponse: boolean;
  isWaitMode: boolean;
}): boolean {
  if (input.realtimeAutoResponds) return false;
  if (input.isWaitMode) return false;
  return input.hasSpeechSinceLastResponse;
}

export function shouldVoiceModeInterruptPlayback(input: {
  speechSource: "server" | "local";
  assistantResponseActive: boolean;
  isPlaying: boolean;
}): boolean {
  if (input.speechSource === "server") return true;
  return !input.assistantResponseActive && !input.isPlaying;
}

export function shouldVoiceModeStreamMicAudio(input: {
  websocketOpen: boolean;
  isMuted: boolean;
  isWaitMode: boolean;
}): boolean {
  if (!input.websocketOpen) return false;
  if (input.isMuted) return false;
  if (input.isWaitMode) return false;
  return true;
}

export function shouldVoiceModeShowWaitButton(): boolean {
  return false;
}

export function shouldVoiceModeRequestBackendTts(input: {
  backendTtsEnabled: boolean;
  alreadyRequestedForResponse: boolean;
  finalizedAssistantText: string;
}): boolean {
  if (!input.backendTtsEnabled) return false;
  if (input.alreadyRequestedForResponse) return false;
  return input.finalizedAssistantText.trim().length > 0;
}
