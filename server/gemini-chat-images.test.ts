import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  buildOrielPromptContext: vi.fn(),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: mocks.invokeLLM,
}));

vi.mock("./oriel-prompt-context", () => ({
  buildOrielPromptContext: mocks.buildOrielPromptContext,
}));

import { chatWithORIEL } from "./gemini";

describe("chatWithORIEL image attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildOrielPromptContext.mockResolvedValue("ORIEL prompt");
    mocks.invokeLLM.mockResolvedValue({
      id: "llm-test",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "I am ORIEL. The image shows a cyan gate.",
          },
          finish_reason: "stop",
        },
      ],
    });
  });

  it("sends attached chat images to the LLM as multimodal message parts", async () => {
    const response = await chatWithORIEL(
      "What do you see in this image?",
      [],
      42,
      {
        imageAttachments: [
          {
            name: "gate.png",
            data: "abc123",
            mimeType: "image/png",
          },
        ],
      }
    );

    expect(response).toBe("I am ORIEL. The image shows a cyan gate.");
    expect(mocks.buildOrielPromptContext).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        userMessage: "What do you see in this image?",
      })
    );

    const invokeArgs = mocks.invokeLLM.mock.calls[0]?.[0];
    const userMessage = invokeArgs.messages.at(-1);
    expect(userMessage.role).toBe("user");
    expect(userMessage.content).toEqual([
      {
        type: "text",
        text: expect.stringContaining("What do you see in this image?"),
      },
      {
        type: "image_url",
        image_url: {
          url: "data:image/png;base64,abc123",
          detail: "auto",
        },
      },
    ]);
  });

  it("filters non-image attachment payloads before calling the LLM", async () => {
    await chatWithORIEL("Read this", [], undefined, {
      imageAttachments: [
        {
          name: "notes.txt",
          data: "not-an-image",
          mimeType: "text/plain",
        },
      ],
    });

    const invokeArgs = mocks.invokeLLM.mock.calls[0]?.[0];
    expect(invokeArgs.messages.at(-1).content).toBe("Read this");
  });
});
