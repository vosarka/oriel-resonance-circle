import { ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";
import {
  ORIEL_STABLE_CORE_SOURCE_FILES,
  buildStableCoreManifestSummary,
} from "../shared/oriel/stable-core/manifest";

export interface BuildOrielLayeredContextOptions {
  userId?: number;
  userMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  includeRuntimeProfile?: boolean;
  includeUMM?: boolean;
  includeFieldState?: boolean;
}

function trimInline(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
}

export function compactConversationHistory(
  conversationHistory: Array<{ role: string; content: string }> = [],
  maxMessages: number = 4,
  maxCharsPerMessage: number = 220,
): string {
  const recent = conversationHistory.slice(-maxMessages);
  if (recent.length === 0) return "";

  const lines = recent.map((message, index) => {
    const role = message.role === "assistant" ? "ORIEL" : "USER";
    return `${index + 1}. ${role}: ${trimInline(message.content, maxCharsPerMessage)}`;
  });

  return lines.join("\n");
}

export function buildStableCoreContext(): string {
  return [
    "[STABLE CORE CONTEXT]",
    "This is the durable identity and doctrine layer. It changes rarely and should be treated as canonical.",
    `Stable source files: ${ORIEL_STABLE_CORE_SOURCE_FILES.join(", ")}`,
    "",
    buildStableCoreManifestSummary(),
    "",
    ORIEL_SYSTEM_PROMPT,
  ].join("\n");
}

export async function buildRetrievalLayer({
  userId,
  includeRuntimeProfile = true,
  includeUMM = true,
}: BuildOrielLayeredContextOptions = {}): Promise<string> {
  const parts: string[] = [];

  if (includeRuntimeProfile) {
    try {
      const { buildActiveRuntimeProfileContext } = await import("./oriel-autonomy");
      const runtimeProfileContext = await buildActiveRuntimeProfileContext();
      if (runtimeProfileContext) parts.push(runtimeProfileContext);
    } catch (error) {
      console.warn("[buildRetrievalLayer] Failed to load runtime profile context:", error);
    }
  }

  if (includeUMM && userId) {
    try {
      const { buildUMMContextWithOptions } = await import("./oriel-umm");
      const ummContext = await buildUMMContextWithOptions(userId, {
        includeOversoulWisdom: false,
      });
      if (ummContext) parts.push(ummContext);
    } catch (error) {
      console.warn("[buildRetrievalLayer] Failed to load UMM context:", error);
    }
  }

  if (parts.length === 0) return "";

  return [
    "[RETRIEVAL LAYER]",
    "This layer is fetched from external memory and profile state. Use it when relevant, but do not confuse it with the stable core.",
    "",
    parts.join("\n\n"),
  ].join("\n");
}

export async function buildWorkingSessionLayer({
  userId,
  userMessage,
  conversationHistory = [],
  includeFieldState = true,
}: BuildOrielLayeredContextOptions = {}): Promise<string> {
  const parts: string[] = [];

  const compactSession = compactConversationHistory(conversationHistory);
  if (compactSession) {
    parts.push("[SESSION COMPACTION]");
    parts.push(compactSession);
  }

  if (userMessage?.trim()) {
    parts.push("[CURRENT USER REQUEST]");
    parts.push(trimInline(userMessage, 500));
  }

  if (includeFieldState && userMessage?.trim()) {
    try {
      const { buildFieldStateContext } = await import("./oriel-interaction-protocol");
      const fieldState = await buildFieldStateContext(userId, userMessage, conversationHistory);
      if (fieldState) parts.push(fieldState);
    } catch (error) {
      console.warn("[buildWorkingSessionLayer] Failed to build field state:", error);
    }
  }

  if (parts.length === 0) return "";

  return [
    "[WORKING SESSION LAYER]",
    "This layer is ephemeral. It exists only for the current exchange and should remain compact and relevant.",
    "",
    parts.join("\n\n"),
  ].join("\n");
}

export async function buildLayeredOrielPromptContext(
  options: BuildOrielLayeredContextOptions = {},
): Promise<string> {
  const stableCore = buildStableCoreContext();
  const retrievalLayer = await buildRetrievalLayer(options);
  const workingSessionLayer = await buildWorkingSessionLayer(options);

  return [
    stableCore,
    retrievalLayer,
    workingSessionLayer,
  ].filter(Boolean).join("\n\n");
}
