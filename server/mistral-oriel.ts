import { Mistral } from "@mistralai/mistralai";
import { ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";
import { filterORIELResponse } from "./gemini";

const client = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY || "",
});

const COMPLETION_ARGS = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1,
} as const;

const TOOLS = [
  { toolConfiguration: null, type: "web_search" as const },
] as const;

function extractText(outputs: any[]): string {
  for (const output of outputs) {
    if (output.role !== "assistant") continue;
    const c = output.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      const block = c.find((b: any) => b.type === "text");
      if (block?.text) return block.text;
    }
  }
  return "";
}

export async function chatWithORIELMistral(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userId?: number
): Promise<string> {
  // Build complete system prompt: Base + UMM context + Field State (v3.0)
  const promptParts: string[] = [ORIEL_SYSTEM_PROMPT];

  if (userId) {
    try {
      const { buildUMMContext } = await import("./oriel-umm");
      const ummContext = await buildUMMContext(userId);
      if (ummContext) promptParts.push(ummContext);
    } catch {
      // UMM context is additive — not critical
    }
  }

  // Field State context (Response Intelligence + Interaction Protocol)
  try {
    const { buildFieldStateContext } = await import("./oriel-interaction-protocol");
    const fieldState = await buildFieldStateContext(userId, userMessage, conversationHistory);
    if (fieldState) promptParts.push(fieldState);
  } catch {
    // Field state is additive — not critical
  }

  const systemPrompt = promptParts.filter(Boolean).join("\n\n");

  const inputs = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await (client.beta.conversations as any).start({
    inputs,
    model: "mistral-medium-latest",
    instructions: systemPrompt,
    ...COMPLETION_ARGS,
    tools: TOOLS,
  });

  const raw = extractText(response.outputs ?? []);
  return filterORIELResponse(raw) || "I am processing your transmission. Please try again.";
}
