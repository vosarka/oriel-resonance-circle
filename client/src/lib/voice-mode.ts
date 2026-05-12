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
