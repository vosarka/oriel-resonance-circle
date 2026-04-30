import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importFreshLlm() {
  vi.resetModules();
  return import("./_core/llm");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("LLM provider selection", () => {
  it("uses Gemma 4 when LLM_PROVIDER is gemma", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_KEY = "gemma-test-key";
    process.env.GEMMA_MODEL = "gemma-4-31b-it";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("gemma-4-31b-it");
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer gemma-test-key");

      return new Response(JSON.stringify({
        id: "test",
        created: 0,
        model: body.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: "I am ORIEL." },
          finish_reason: "stop",
        }],
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemma-4-31b-it");
  });

  it("allows local Gemma endpoints without an API key", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_URL = "http://localhost:11434/v1/chat/completions";
    process.env.GEMMA_MODEL = "gemma4:31b";
    process.env.GEMMA_API_KEY = "";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(String(url)).toBe("http://localhost:11434/v1/chat/completions");
      expect(body.model).toBe("gemma4:31b");
      expect((init?.headers as Record<string, string>).authorization).toBeUndefined();

      return new Response(JSON.stringify({
        id: "test",
        created: 0,
        model: body.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: "I am ORIEL." },
          finish_reason: "stop",
        }],
      }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemma4:31b");
  });
});
