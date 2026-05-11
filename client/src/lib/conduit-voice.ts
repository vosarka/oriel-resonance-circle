export function getConduitInputDisabled(input: {
  chatPending: boolean;
  isSpeaking: boolean;
  transmissionInterfering: boolean;
}) {
  return input.chatPending || input.transmissionInterfering;
}

export function getSpeechFallbackTimeoutMs(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMs = wordCount * 450 + 2000;
  return Math.max(4000, Math.min(25000, estimatedMs));
}
