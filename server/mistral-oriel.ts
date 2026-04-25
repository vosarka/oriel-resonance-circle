import { Mistral } from "@mistralai/mistralai";
import { filterORIELResponse } from "./gemini";
import { buildOrielPromptContext } from "./oriel-prompt-context";

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
  const systemPrompt = await buildOrielPromptContext({
    userId,
    userMessage,
    conversationHistory,
  });

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
