import { describe, expect, it } from "vitest";

import { getAuthRedirectTarget, getLoginUrl } from "../client/src/const";

describe("auth return URL helpers", () => {
  it("preserves a safe same-site purchase path through login", () => {
    expect(getLoginUrl("/oriel-signature-glimpse")).toBe(
      "/auth?next=%2Foriel-signature-glimpse"
    );
    expect(getLoginUrl("/signature-intake/92")).toBe(
      "/auth?next=%2Fsignature-intake%2F92"
    );
  });

  it("rejects external auth return targets", () => {
    expect(getLoginUrl("https://example.com/phish")).toBe("/auth");
    expect(getAuthRedirectTarget("?next=https%3A%2F%2Fexample.com")).toBe("/");
  });

  it("resolves the post-auth target from the next query parameter", () => {
    expect(
      getAuthRedirectTarget("?next=%2Foriel-founding-signature-letter")
    ).toBe("/oriel-founding-signature-letter");
    expect(getAuthRedirectTarget("")).toBe("/");
  });
});
