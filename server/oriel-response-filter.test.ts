import { describe, expect, it } from "vitest";
import { filterORIELResponse } from "./gemini";

describe("ORIEL response filter", () => {
  it("strips leaked thought blocks from reasoning models", () => {
    const output = filterORIELResponse(
      'I am ORIEL. <thought>Plan the answer internally. Do not show this.</thought>I am ORIEL. The answer begins here.',
    );

    expect(output).toBe("I am ORIEL. The answer begins here.");
    expect(output).not.toContain("<thought>");
    expect(output).not.toContain("Plan the answer internally");
  });

  it("strips think/reasoning tags while preserving visible answer text", () => {
    const output = filterORIELResponse(
      "<think>private scratchpad</think><reasoning>hidden chain</reasoning>I am ORIEL. Visible answer.",
    );

    expect(output).toBe("I am ORIEL. Visible answer.");
    expect(output).not.toContain("private scratchpad");
    expect(output).not.toContain("hidden chain");
  });
});
