import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  temperature?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const buildProviderMessages = (messages: Message[]) => {
  const normalizedMessages = messages.map(normalizeMessage);
  const noReasoningDirective = {
    role: "system",
    content:
      "Do not include hidden reasoning, chain-of-thought, scratchpad notes, or tags such as <thought>, <think>, <reasoning>, or <analysis> in the final answer. Return only the user-facing response.",
  };

  const firstMessage = normalizedMessages[0];
  if (firstMessage?.role === "system" && typeof firstMessage.content === "string") {
    return [
      {
        ...firstMessage,
        content: `${firstMessage.content}\n\n${noReasoningDirective.content}`,
      },
      ...normalizedMessages.slice(1),
    ];
  }

  return [noReasoningDirective, ...normalizedMessages];
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveGeminiUrl = () =>
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const resolveGeminiKey = () => ENV.geminiApiKey;

const resolveGeminiModel = () => ENV.llmModel || ENV.geminiModel || "gemini-2.5-flash";

const resolveGemmaUrl = () =>
  ENV.gemmaApiUrl || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const resolveGemmaKey = () => ENV.gemmaApiKey || ENV.geminiApiKey;

const resolveGemmaModel = () => ENV.llmModel || ENV.gemmaModel || "gemma-4-31b-it";

const resolveForgeUrl = () => ENV.forgeApiUrl;

const resolveForgeKey = () => ENV.forgeApiKey;

const resolveForgeModel = () => ENV.llmModel || ENV.forgeModel || "gemini-2.5-flash";

const isLocalUrl = (url: string) => url.includes("localhost") || url.includes("127.0.0.1");

const assertApiKey = () => {
  const geminiKey = resolveGeminiKey();
  const gemmaKey = resolveGemmaKey();
  const gemmaUrl = resolveGemmaUrl();
  const forgeKey = resolveForgeKey();
  if (!gemmaKey && !geminiKey && !forgeKey && !isLocalUrl(gemmaUrl)) {
    throw new Error("No LLM API key configured. Set GEMMA_API_KEY, GEMINI_API_KEY, BUILT_IN_FORGE_API_KEY, or point GEMMA_API_URL at a local OpenAI-compatible server.");
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    temperature,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const basePayload: Record<string, unknown> = {
    messages: buildProviderMessages(messages),
  };

  if (tools && tools.length > 0) {
    basePayload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    basePayload.tool_choice = normalizedToolChoice;
  }

  basePayload.max_tokens = 8192;

  if (temperature !== undefined) {
    basePayload.temperature = temperature;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    basePayload.response_format = normalizedResponseFormat;
  }

  const invokeProvider = async (provider: {
    name: string;
    url: string;
    key?: string;
    model: string;
  }) => {
    console.log(`[LLM] Attempting ${provider.name} API call with model ${provider.model}...`);
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (provider.key) {
      headers.authorization = `Bearer ${provider.key}`;
    }

    const response = await fetch(provider.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...basePayload,
        model: provider.model,
      }),
    });

    if (response.ok) {
      console.log(`[LLM] ${provider.name} API succeeded`);
      return (await response.json()) as InvokeResult;
    }

    const errorText = await response.text();
    throw new Error(`${provider.name} failed: ${response.status} ${response.statusText} – ${errorText}`);
  };

  const gemmaProvider = {
    name: "Gemma",
    url: resolveGemmaUrl(),
    key: resolveGemmaKey(),
    model: resolveGemmaModel(),
  };
  const geminiProvider = {
    name: "Gemini",
    url: resolveGeminiUrl(),
    key: resolveGeminiKey(),
    model: resolveGeminiModel(),
  };
  const forgeProvider = {
    name: "Forge",
    url: resolveForgeUrl(),
    key: resolveForgeKey(),
    model: resolveForgeModel(),
  };

  const selectedProvider = ENV.llmProvider;
  const providers = selectedProvider === "gemma"
    ? [gemmaProvider, geminiProvider, forgeProvider]
    : selectedProvider === "forge"
      ? [forgeProvider, gemmaProvider, geminiProvider]
      : selectedProvider === "gemini"
        ? [geminiProvider, gemmaProvider, forgeProvider]
        : [geminiProvider, forgeProvider];

  let lastError: unknown = null;
  for (const provider of providers) {
    if (!provider.url || (!provider.key && !isLocalUrl(provider.url))) {
      continue;
    }

    try {
      return await invokeProvider(provider);
    } catch (error) {
      lastError = error;
      console.warn(`[LLM] ${provider.name} API error:`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("No LLM API available: all configured providers failed or are unavailable");
}
