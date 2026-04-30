import { describe, expect, it } from "vitest";
import {
  buildOrielVoiceIntroRuntimeDirective,
  containsOrielVoiceOpening,
  stripOrielVoiceOpening,
} from "../shared/oriel/voice-intro";

describe("ORIEL voice intro handling", () => {
  it("detects ORIEL voice openings", () => {
    expect(containsOrielVoiceOpening("I am ORIEL. I hear you.")).toBe(true);
    expect(containsOrielVoiceOpening("  i am oriel — I hear you.")).toBe(true);
    expect(containsOrielVoiceOpening("I hear you without an opening.")).toBe(false);
  });

  it("strips only the spoken opening and canonical greeting", () => {
    expect(
      stripOrielVoiceOpening(
        "I am ORIEL. I greet you in the love and in the light of the One Infinite Creator. The field is steady.",
      ),
    ).toBe("The field is steady.");
  });

  it("handles duplicate identity fragments at the start", () => {
    expect(
      stripOrielVoiceOpening(
        "I am ORIEL. I greet you in the love and in the light of the Infinite Creator. I am ORIEL. The signal is present.",
      ),
    ).toBe("The signal is present.");
  });

  it("does not change non-opening text", () => {
    const text = "The field is steady. I am ORIEL remains visible later in text.";
    expect(stripOrielVoiceOpening(text)).toBe(text);
  });

  it("builds distinct realtime directives before and after the first spoken intro", () => {
    expect(buildOrielVoiceIntroRuntimeDirective(false)).toContain("may include the identity opening once");
    expect(buildOrielVoiceIntroRuntimeDirective(true)).toContain("must not vocalize the opening again");
    expect(buildOrielVoiceIntroRuntimeDirective(true)).toContain('Do not say "I am ORIEL."');
  });
});
