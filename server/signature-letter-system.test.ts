import { describe, expect, it } from "vitest";

import { signatureOrders } from "../drizzle/schema";
import {
  SIGNATURE_PRODUCTS,
  assertCanAccessIntake,
  assertCanGenerateSnapshot,
  assertCanMarkDelivered,
  buildStripeCheckoutSessionRequest,
  generateSignatureLetterDraftMarkdown,
  normalizeSignatureSnapshot,
  verifyStripeWebhookSignature,
} from "./signature-letter-system";

const intake = {
  name: "Elena Ionescu",
  email: "elena@example.com",
  birthDate: "1990-01-02",
  birthTime: "03:04",
  birthPlace: "Bucharest",
  birthCountry: "Romania",
  timezone: "Europe/Bucharest",
  focusQuestion: "What pattern is asking to be integrated?",
  preferredTone: "balanced" as const,
  avoidAssumptions: "Do not assume a therapeutic diagnosis.",
  consentAccepted: true,
};

const rawSignature = {
  vrcType: "Catalyst",
  vrcAuthority: "Emotional Resonance",
  ninecenters: {
    "Solar Plexus": { defined: true },
    Sacral: { defined: false },
    Spleen: { defined: true },
  },
  primeStack: [
    {
      position: 1,
      codon: 11,
      codonName: "Peace",
      facetFull: "A - Initiating",
      center: "Solar Plexus",
      name: "Conscious Sun",
    },
    {
      position: 2,
      codon: 22,
      codonName: "Grace",
      facetFull: "B - Stabilizing",
      center: "G-Center",
      name: "Conscious Earth",
    },
  ],
  channelStatuses: [
    {
      gateA: 11,
      gateB: 56,
      active: true,
      centerA: "Ajna",
      centerB: "Throat",
    },
    {
      gateA: 1,
      gateB: 8,
      active: false,
      centerA: "G-Center",
      centerB: "Throat",
    },
  ],
  microCorrections: [
    {
      type: "breath",
      instruction: "Complete three slow breaths before answering.",
      falsifier: "The pattern should soften within one day.",
      potentialOutcome: "Less reactive speech.",
    },
  ],
  diagnosticTransmission:
    "Your signal stabilizes when emotion is given time before speech.",
  coreCodonEngine: {
    dominantCodons: [
      {
        codon: 11,
        name: "Peace",
        shadow: "Obscurity",
        gift: "Idealism",
      },
    ],
  },
  calculationContext: {
    status: "exact",
    birthDate: "1990-01-02",
    birthTime: "03:04",
    birthPlace: "Bucharest",
    birthCountry: "Romania",
    latitude: 44.4268,
    longitude: 26.1025,
    resolvedTimezoneId: "Europe/Bucharest",
    timezoneOffsetHours: 2,
  },
  engineVersion: 2,
};

describe("ORIEL Signature Letter system helpers", () => {
  it("defines the two paid products with Fibonacci sequence pricing", () => {
    expect(SIGNATURE_PRODUCTS.glimpse).toMatchObject({
      productType: "glimpse",
      priceEur: 23.58,
      pageRange: "2-3",
    });
    expect(SIGNATURE_PRODUCTS.founding).toMatchObject({
      productType: "founding",
      priceEur: 81.32,
      pageRange: "8-12",
      followupIncluded: true,
    });
  });

  it("stores Fibonacci sequence prices with cent precision", () => {
    const priceColumn = signatureOrders.priceEur as any;

    expect(priceColumn.columnType).toBe("MySqlDecimal");
    expect(priceColumn.config).toMatchObject({
      precision: 10,
      scale: 2,
    });
  });

  it("only lets paid or intake-ready orders access intake", () => {
    expect(() => assertCanAccessIntake("pending_payment")).toThrow(
      /paid order/i,
    );
    expect(() => assertCanAccessIntake("paid")).not.toThrow();
    expect(() => assertCanAccessIntake("intake_needed")).not.toThrow();
  });

  it("requires paid intake with consent before snapshot generation", () => {
    expect(() =>
      assertCanGenerateSnapshot({
        status: "paid",
        intakeReceived: false,
        consentAccepted: false,
      }),
    ).toThrow(/intake/i);
    expect(() =>
      assertCanGenerateSnapshot({
        status: "intake_received",
        intakeReceived: true,
        consentAccepted: false,
      }),
    ).toThrow(/consent/i);
    expect(() =>
      assertCanGenerateSnapshot({
        status: "intake_received",
        intakeReceived: true,
        consentAccepted: true,
      }),
    ).not.toThrow();
  });

  it("normalizes static signature output into the letter snapshot contract", () => {
    const normalized = normalizeSignatureSnapshot(rawSignature, "founding");

    expect(normalized.type).toBe("Catalyst");
    expect(normalized.authority).toBe("Emotional Resonance");
    expect(normalized.definedCenters).toEqual(["Solar Plexus", "Spleen"]);
    expect(normalized.openCenters).toEqual(["Sacral"]);
    expect(normalized.coreCodons[0]).toMatchObject({
      codon: 11,
      codonName: "Peace",
      position: 1,
    });
    expect(normalized).toMatchObject({
      resonanceLinks: ["Codon 11-Codon 56: Ajna to Throat"],
    });
    expect(normalized.correctionProtocols[0]).toContain(
      "Complete three slow breaths",
    );
    expect(normalized.shadowGiftFraming[0]).toContain("Obscurity");
    expect(normalized.calculationContext).toMatchObject({
      status: "exact",
      birthDate: "1990-01-02",
      birthTime: "03:04",
      birthPlace: "Bucharest",
      birthCountry: "Romania",
      latitude: 44.4268,
      longitude: 26.1025,
      resolvedTimezoneId: "Europe/Bucharest",
      timezoneOffsetHours: 2,
    });
  });

  it("downgrades incomplete calculation contexts even when explicit gaps are partial", () => {
    const normalized = normalizeSignatureSnapshot({
      ...rawSignature,
      calculationContext: {
        status: "exact",
        birthDate: "1990-01-02",
        birthTime: null,
        birthPlace: "Bucharest",
        birthCountry: "Romania",
        latitude: null,
        longitude: null,
        resolvedTimezoneId: "Europe/Bucharest",
        timezoneOffsetHours: null,
        missingPrecision: ["birth data source"],
      },
    }, "founding");

    expect(normalized.calculationContext).toMatchObject({
      status: "missing_precision",
      missingPrecision: [
        "birth data source",
        "birth time",
        "birth coordinates",
        "timezone offset",
      ],
    });
  });

  it("generates product-specific founder-curation markdown", () => {
    const normalized = normalizeSignatureSnapshot(rawSignature, "glimpse");
    const glimpse = generateSignatureLetterDraftMarkdown({
      intake,
      normalized,
      productType: "glimpse",
    });

    expect(glimpse).toContain("ORIEL Signature Glimpse");
    expect(glimpse).toContain("Founder curation required before delivery");
    expect(glimpse).toContain("Calculation Trust Contract");
    expect(glimpse).toContain("Status: exact");
    expect(glimpse).toContain("Birth data: 1990-01-02 03:04, Bucharest, Romania");
    expect(glimpse).toContain("Coordinates: 44.4268, 26.1025");
    expect(glimpse).toContain("Resolved timezone: Europe/Bucharest (UTC+2)");
    expect(glimpse).toContain("What ORIEL should avoid assuming");
    expect(glimpse).toContain("not medical, legal, therapeutic, financial");

    const founding = generateSignatureLetterDraftMarkdown({
      intake,
      normalized: normalizeSignatureSnapshot(rawSignature, "founding"),
      productType: "founding",
    });

    expect(founding).toContain("ORIEL Founding Signature Letter");
    expect(founding).toContain("Active Resonance Links");
    expect(founding).not.toContain("Active Channels");
    expect(founding).toContain("Follow-up clarification");
    expect(founding.split("\n").length).toBeGreaterThan(glimpse.split("\n").length);
  });

  it("builds Stripe Checkout payload with order ownership metadata", () => {
    const payload = buildStripeCheckoutSessionRequest({
      appBaseUrl: "https://orielsignal.space",
      orderId: 91,
      productType: "founding",
      userId: 42,
      customerEmail: "elena@example.com",
    });

    expect(payload.success_url).toBe(
      "https://orielsignal.space/signature-intake/91",
    );
    expect(payload.cancel_url).toBe(
      "https://orielsignal.space/oriel-founding-signature-letter?cancelled=1",
    );
    expect(payload.client_reference_id).toBe("91");
    expect(payload.metadata).toEqual({
      orderId: "91",
      productType: "founding",
      userId: "42",
    });
    expect(payload.line_items[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: 8132,
        product_data: {
          name: "ORIEL Founding Signature Letter",
        },
      },
    });

    const glimpsePayload = buildStripeCheckoutSessionRequest({
      appBaseUrl: "https://orielsignal.space/",
      orderId: 92,
      productType: "glimpse",
      userId: 42,
    });

    expect(glimpsePayload.cancel_url).toBe(
      "https://orielsignal.space/oriel-signature-glimpse?cancelled=1",
    );
    expect(glimpsePayload.line_items[0]).toMatchObject({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: 2358,
        product_data: {
          name: "ORIEL Signature Glimpse",
        },
      },
    });
  });

  it("verifies Stripe webhook signatures without the Stripe SDK", () => {
    const body = JSON.stringify({ id: "evt_123" });
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = verifyStripeWebhookSignature.createTestSignature({
      body,
      secret: "whsec_test",
      timestamp,
    });

    expect(
      verifyStripeWebhookSignature({
        body,
        signatureHeader: `t=${timestamp},v1=${signature}`,
        secret: "whsec_test",
      }),
    ).toBe(true);

    expect(
      verifyStripeWebhookSignature({
        body,
        signatureHeader: `t=${timestamp},v1=bad`,
        secret: "whsec_test",
      }),
    ).toBe(false);
  });

  it("does not allow delivery before a final PDF is present", () => {
    expect(() =>
      assertCanMarkDelivered({
        status: "draft_ready",
        finalPdfStorageKey: null,
      }),
    ).toThrow(/final pdf/i);

    expect(() =>
      assertCanMarkDelivered({
        status: "pdf_ready",
        finalPdfStorageKey: "signature-letters/91/final.pdf",
      }),
    ).not.toThrow();
  });
});
