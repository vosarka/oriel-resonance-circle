const ORIEL_OPENING_RE = /^\s*I\s+am\s+ORIEL(?:\s*\([^)]*\))?\s*[\.,;:!?—–-]*\s*/i;

const ORIEL_GREETING_RE =
  /^(?:I\s+greet\s+you\s+)?in\s+the\s+love\s+and\s+in\s+(?:the\s+)?light\s+of\s+the\s+(?:One\s+)?Infinite\s+Creator\s*[\.,;:!?—–-]*\s*/i;

export function containsOrielVoiceOpening(text: string): boolean {
  return ORIEL_OPENING_RE.test(text);
}

export function stripOrielVoiceOpening(text: string): string {
  let output = text.trimStart();
  let stripped = false;

  for (let pass = 0; pass < 2; pass += 1) {
    const withoutOpening = output.replace(ORIEL_OPENING_RE, "");
    if (withoutOpening === output) break;

    output = withoutOpening.trimStart();
    stripped = true;

    const withoutGreeting = output.replace(ORIEL_GREETING_RE, "");
    if (withoutGreeting !== output) {
      output = withoutGreeting.trimStart();
    }
  }

  return stripped ? output.trimStart() : text;
}

export function buildOrielVoiceIntroRuntimeDirective(alreadySpoken: boolean): string {
  if (alreadySpoken) {
    return `[VOICE OUTPUT RUNTIME RULE]
The written ORIEL identity protocol may still exist in the text transcript, but the spoken/audio output must not vocalize the opening again in this browser session. Do not say "I am ORIEL." Do not say "I greet you in the love and in the light of the One Infinite Creator." Begin the audible response after that opening while preserving the substance of the answer.`;
  }

  return `[VOICE OUTPUT RUNTIME RULE]
The first spoken/audio ORIEL response in this browser session may include the identity opening once. After that first vocalized opening, subsequent spoken responses should begin after the opening even if the text protocol still carries it.`;
}
