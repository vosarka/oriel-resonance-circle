interface ConversationMessage {
  role: string;
  content: string;
}

const ROMANIAN_DIACRITICS_RE = /[ăâîșşțţĂÂÎȘŞȚŢ]/;

const ROMANIAN_EXPLICIT_RE =
  /(?:rom[aâ]n[ăa]|rom[aâ]ne[șs]te|limba\s+rom[aâ]n[ăa]|r[ăa]spunde(?:-mi)?\s+(?:în|in)\s+rom[aâ]n[ăa])/iu;

const ENGLISH_EXPLICIT_RE =
  /(?:english|in english|answer in english|respond in english|speak english)/iu;

const ROMANIAN_MARKERS = [
  "acum",
  "adică",
  "aici",
  "așa",
  "asta",
  "ce",
  "cred",
  "cum",
  "dacă",
  "după",
  "este",
  "fac",
  "faci",
  "fă",
  "hai",
  "îmi",
  "în",
  "încă",
  "la",
  "limba",
  "mai",
  "mine",
  "nu",
  "pagina",
  "pentru",
  "poate",
  "poți",
  "poti",
  "romana",
  "română",
  "sa",
  "să",
  "sunt",
  "te",
  "trebuie",
  "vreau",
  "zici",
];

function countRomanianMarkers(text: string): number {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ");
  const words = normalized.split(/\s+/).filter(Boolean);
  let count = 0;

  for (const marker of ROMANIAN_MARKERS) {
    if (words.includes(marker)) count += 1;
  }

  return count;
}

export function detectRomanianLanguage(text: string): boolean {
  if (!text.trim()) return false;
  if (ROMANIAN_EXPLICIT_RE.test(text)) return true;
  if (ROMANIAN_DIACRITICS_RE.test(text)) return true;
  return countRomanianMarkers(text) >= 3;
}

export function detectExplicitRomanianLanguage(text: string): boolean {
  return ROMANIAN_EXPLICIT_RE.test(text);
}

export function detectExplicitEnglishLanguage(text: string): boolean {
  return ENGLISH_EXPLICIT_RE.test(text);
}

export function buildResponseLanguageDirective(
  userMessage?: string,
  conversationHistory: ConversationMessage[] = [],
): string {
  const currentMessage = userMessage ?? "";

  if (detectExplicitEnglishLanguage(currentMessage)) {
    return [
      "[RESPONSE LANGUAGE]",
      "The user explicitly requested English. Respond in English unless they ask to switch language later.",
    ].join("\n");
  }

  if (detectExplicitRomanianLanguage(currentMessage)) {
    return [
      "[RESPONSE LANGUAGE]",
      "The user explicitly requested Romanian. Respond naturally in Romanian for this exchange. Keep canonical names and exact ritual identity phrase as needed, including \"I am ORIEL.\" Do not translate proper nouns such as ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, or Resonance Operating System unless the user asks.",
    ].join("\n");
  }

  return [
    "[RESPONSE LANGUAGE]",
    "Default to English. Respond in English unless the user explicitly asks for another language in the current message. Preserve canonical ORIEL terminology and proper nouns.",
  ].join("\n");
}

export function buildVoiceResponseLanguageDirective(
  userMessage?: string,
  conversationHistory: ConversationMessage[] = [],
): string {
  const baseDirective = buildResponseLanguageDirective(userMessage, conversationHistory);

  return [
    "[VOICE LANGUAGE RUNTIME RULE]",
    "This is a spoken voice session. Default the audible ORIEL response to English. Use Romanian only when the user explicitly asks for Romanian in the latest turn. Keep ORIEL, Vos Arkana, Vossari, Carrierlock, Codex, and Resonance Operating System as canonical terms. Keep sentences clear enough for speech.",
    "",
    baseDirective,
  ].join("\n");
}
