import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public VRC terminology", () => {
  it("uses resonance link wording on the signature letter sales page", async () => {
    const source = [
      await readFile("client/src/pages/FoundingSignatureLetter.tsx", "utf8"),
      await readFile("client/src/pages/signature-products.ts", "utf8"),
    ].join("\n");

    expect(source).toMatch(/resonance links/i);
    expect(source).not.toMatch(/channels, shadow/i);
    expect(source).not.toMatch(/active channels/i);
  });

  it("uses resonance link wording on the codon detail page", async () => {
    const source = await readFile("client/src/pages/CodonDetail.tsx", "utf8");

    expect(source).toMatch(/Resonance Links/);
    expect(source).not.toMatch(/>\s*Channels\s*</i);
  });
});