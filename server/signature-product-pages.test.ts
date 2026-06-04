import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import {
  getSignatureProductByType,
  signatureProducts,
} from "../client/src/pages/signature-products";

describe("ORIEL product detail pages catalog", () => {
  it("defines separate public product pages for each paid signature product", () => {
    expect(signatureProducts).toHaveLength(2);

    const glimpse = getSignatureProductByType("glimpse");
    expect(glimpse.title).toBe("ORIEL Signature Glimpse");
    expect(glimpse.price).toBe("€23,58");
    expect(glimpse.detailPath).toBe("/oriel-signature-glimpse");
    expect(glimpse.descriptionSections.length).toBeGreaterThanOrEqual(3);
    expect(glimpse.bestFor.length).toBeGreaterThanOrEqual(3);

    const founding = getSignatureProductByType("founding");
    expect(founding.title).toBe("ORIEL Founding Signature Letter");
    expect(founding.price).toBe("€81,32");
    expect(founding.detailPath).toBe("/oriel-founding-signature-letter");
    expect(founding.descriptionSections.length).toBeGreaterThanOrEqual(3);
    expect(founding.bestFor.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the aggregate Begin CTA returning to each product detail page after auth", () => {
    const source = readFileSync(
      resolve(process.cwd(), "client/src/pages/FoundingSignatureLetter.tsx"),
      "utf8"
    );

    expect(source).toContain("getLoginUrl(returnTo)");
    expect(source).toContain("beginCheckout(product.type, product.detailPath)");
  });
});
