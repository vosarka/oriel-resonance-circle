import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  storagePut: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

vi.mock("./env", () => ({
  ENV: {
    geminiApiKey: "test-gemini-key",
    geminiImageModel: "",
    llmRequestTimeoutMs: 45_000,
  },
}));

vi.mock("../storage", () => ({
  storagePut: mocks.storagePut,
}));

vi.mock("node:fs/promises", () => ({
  mkdir: mocks.mkdir,
  writeFile: mocks.writeFile,
}));

import { generateImage } from "./imageGeneration";
import { ENV } from "./env";

const originalFetch = globalThis.fetch;
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

describe("generateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mocks.fetch as unknown as typeof fetch;
    ENV.geminiImageModel = "";
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                { text: "Generated." },
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: pngBytes.toString("base64"),
                  },
                },
              ],
            },
          },
        ],
      }),
    });
    mocks.storagePut.mockResolvedValue({
      key: "oriel-chat-images/test.png",
      url: "https://cdn.example.test/oriel-chat-images/test.png",
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("calls Gemini image generation and stores returned inline image data", async () => {
    const result = await generateImage({
      prompt: "A cyan Codon gate opening over a quiet Center",
    });

    expect(result.url).toMatch(/^\/generated\/oriel-chat-images\/[\w-]+\.png$/);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-goog-api-key": "test-gemini-key",
        }),
      })
    );

    const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
    expect(body.generationConfig.responseModalities).toEqual(["TEXT", "IMAGE"]);
    expect(body.contents[0].parts[0]).toEqual({
      text: "A cyan Codon gate opening over a quiet Center",
    });

    expect(mocks.storagePut).toHaveBeenCalledWith(
      expect.stringMatching(/^oriel-chat-images\/[\w-]+\.png$/),
      pngBytes,
      "image/png"
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("uploads/generated/oriel-chat-images"),
      pngBytes
    );
  });

  it("normalizes deprecated and API-prefixed Gemini image model env values", async () => {
    ENV.geminiImageModel = "models/gemini-2.5-flash-image-preview";

    await generateImage({ prompt: "A teal resonance sigil" });

    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",
      expect.any(Object)
    );
  });

  it("keeps the local generated URL when object storage upload fails", async () => {
    mocks.storagePut.mockRejectedValueOnce(new Error("storage offline"));

    const result = await generateImage({ prompt: "A gold resonance field" });

    expect(result.url).toMatch(/^\/generated\/oriel-chat-images\/[\w-]+\.png$/);
    expect(mocks.mkdir).toHaveBeenCalledWith(
      expect.stringContaining("uploads/generated/oriel-chat-images"),
      { recursive: true }
    );
    expect(mocks.writeFile).toHaveBeenCalledWith(
      expect.stringContaining("uploads/generated/oriel-chat-images"),
      pngBytes
    );
  });
});
