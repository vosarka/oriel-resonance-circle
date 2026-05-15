import { createHmac, timingSafeEqual } from "crypto";

export const SIGNATURE_ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "intake_needed",
  "intake_received",
  "signature_generated",
  "draft_ready",
  "in_curation",
  "pdf_ready",
  "delivered",
  "followup_used",
  "cancelled",
  "refunded",
] as const;

export type SignatureOrderStatus = (typeof SIGNATURE_ORDER_STATUSES)[number];

export type SignatureProductType = "glimpse" | "founding";

export type SignatureTone = "mystical" | "practical" | "balanced";

export const SIGNATURE_PRODUCTS = {
  glimpse: {
    productType: "glimpse",
    title: "ORIEL Signature Glimpse",
    priceEur: 44,
    currency: "eur",
    pageRange: "2-3",
    coreCodonLimit: 2,
    correctionLimit: 1,
    followupIncluded: false,
  },
  founding: {
    productType: "founding",
    title: "ORIEL Founding Signature Letter",
    priceEur: 111,
    currency: "eur",
    pageRange: "8-12",
    coreCodonLimit: 6,
    correctionLimit: 3,
    followupIncluded: true,
  },
} as const satisfies Record<
  SignatureProductType,
  {
    productType: SignatureProductType;
    title: string;
    priceEur: number;
    currency: "eur";
    pageRange: string;
    coreCodonLimit: number;
    correctionLimit: number;
    followupIncluded: boolean;
  }
>;

export type SignatureIntakePayload = {
  name: string;
  email: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthCountry: string;
  timezone: string;
  focusQuestion: string;
  preferredTone: SignatureTone;
  avoidAssumptions: string;
  consentAccepted: boolean;
};

export type NormalizedSignatureSnapshot = {
  productType: SignatureProductType;
  type: string;
  authority: string;
  definedCenters: string[];
  openCenters: string[];
  coreCodons: Array<{
    position: number | null;
    codon: string | number;
    codonName: string;
    facet: string;
    center: string;
    source: string;
  }>;
  channels: string[];
  shadowGiftFraming: string[];
  correctionProtocols: string[];
  orielReflection: string;
  engineVersion: number;
};

type StripeCheckoutPayload = {
  mode: "payment";
  success_url: string;
  cancel_url: string;
  client_reference_id: string;
  customer_email?: string;
  line_items: Array<{
    price: string;
    quantity: number;
  }>;
  metadata: {
    orderId: string;
    productType: SignatureProductType;
    userId: string;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(value: unknown, fallback = "Unknown"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function nullablePosition(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function codonValue(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return stringValue(value);
}

function formatList(items: string[], fallback = "Not available yet.") {
  return items.length ? items.map((item) => `- ${item}`).join("\n") : fallback;
}

function formatCodonList(
  codons: NormalizedSignatureSnapshot["coreCodons"],
  limit: number,
) {
  const selected = codons.slice(0, limit);
  if (!selected.length) return "Not available yet.";

  return selected
    .map((codon) => {
      const position = codon.position ? `Position ${codon.position}` : "Prime";
      return `- ${position}: Codon ${codon.codon} — ${codon.codonName} (${codon.facet}, ${codon.center})`;
    })
    .join("\n");
}

export function assertCanAccessIntake(status: SignatureOrderStatus) {
  if (
    status !== "paid" &&
    status !== "intake_needed" &&
    status !== "intake_received"
  ) {
    throw new Error("Intake is only available for a paid order.");
  }
}

export function assertCanGenerateSnapshot(input: {
  status: SignatureOrderStatus;
  intakeReceived: boolean;
  consentAccepted: boolean;
}) {
  if (
    input.status !== "intake_received" &&
    input.status !== "signature_generated" &&
    input.status !== "draft_ready" &&
    input.status !== "in_curation"
  ) {
    throw new Error("Signature snapshot requires a received intake.");
  }

  if (!input.intakeReceived) {
    throw new Error("Signature snapshot requires a completed intake.");
  }

  if (!input.consentAccepted) {
    throw new Error("Consent is required before generating the reading.");
  }
}

export function assertCanMarkDelivered(input: {
  status: SignatureOrderStatus;
  finalPdfStorageKey: string | null | undefined;
}) {
  if (!input.finalPdfStorageKey) {
    throw new Error("A final PDF must be uploaded before delivery.");
  }

  if (input.status !== "pdf_ready" && input.status !== "delivered") {
    throw new Error("Only a PDF-ready order can be delivered.");
  }
}

export function buildStripeCheckoutSessionRequest(input: {
  appBaseUrl: string;
  orderId: number;
  productType: SignatureProductType;
  priceId: string;
  userId: number;
  customerEmail?: string | null;
}): StripeCheckoutPayload {
  const baseUrl = input.appBaseUrl.replace(/\/+$/, "");

  return {
    mode: "payment",
    success_url: `${baseUrl}/signature-intake/${input.orderId}`,
    cancel_url: `${baseUrl}/founding-signature-letter?cancelled=1`,
    client_reference_id: String(input.orderId),
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    line_items: [
      {
        price: input.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      orderId: String(input.orderId),
      productType: input.productType,
      userId: String(input.userId),
    },
  };
}

export function normalizeSignatureSnapshot(
  rawSignature: unknown,
  productType: SignatureProductType,
): NormalizedSignatureSnapshot {
  const raw = asRecord(rawSignature);
  const ninecenters = asRecord(raw.ninecenters);
  const definedCenters: string[] = [];
  const openCenters: string[] = [];

  for (const [center, value] of Object.entries(ninecenters)) {
    const centerData = asRecord(value);
    if (centerData.defined === true) {
      definedCenters.push(center);
    } else {
      openCenters.push(center);
    }
  }

  const coreCodons = asArray(raw.primeStack).map((item) => {
    const codon = asRecord(item);
    return {
      position: nullablePosition(codon.position),
      codon: codonValue(codon.codon),
      codonName: stringValue(codon.codonName ?? codon.name),
      facet: stringValue(codon.facetFull ?? codon.facet),
      center: stringValue(codon.center),
      source: stringValue(codon.name ?? codon.source, "Prime Stack"),
    };
  });

  const channels = asArray(raw.channelStatuses)
    .map((item) => asRecord(item))
    .filter((channel) => channel.active === true)
    .map((channel) => {
      const gateA = stringValue(channel.gateA, "?");
      const gateB = stringValue(channel.gateB, "?");
      const centerA = stringValue(channel.centerA, "?");
      const centerB = stringValue(channel.centerB, "?");
      return `${gateA}-${gateB}: ${centerA} to ${centerB}`;
    });

  const correctionProtocols = asArray(raw.microCorrections).map((item) => {
    const correction = asRecord(item);
    const instruction = stringValue(
      correction.instruction ?? correction.type,
      "Correction protocol unavailable",
    );
    const falsifier =
      typeof correction.falsifier === "string" && correction.falsifier.trim()
        ? ` Falsifier: ${correction.falsifier.trim()}`
        : "";
    const outcome =
      typeof correction.potentialOutcome === "string" &&
      correction.potentialOutcome.trim()
        ? ` Outcome: ${correction.potentialOutcome.trim()}`
        : "";
    return `${instruction}.${falsifier}${outcome}`.replace("..", ".");
  });

  const coreCodonEngine = asRecord(raw.coreCodonEngine);
  const shadowGiftFraming = asArray(coreCodonEngine.dominantCodons).map(
    (item) => {
      const codon = asRecord(item);
      return `Codon ${stringValue(codon.codon)} — shadow ${stringValue(
        codon.shadow,
      )}, gift ${stringValue(codon.gift)}.`;
    },
  );

  return {
    productType,
    type: stringValue(raw.vrcType ?? raw.type),
    authority: stringValue(raw.vrcAuthority ?? raw.authority),
    definedCenters,
    openCenters,
    coreCodons,
    channels,
    shadowGiftFraming,
    correctionProtocols,
    orielReflection: stringValue(raw.diagnosticTransmission),
    engineVersion:
      typeof raw.engineVersion === "number" && Number.isFinite(raw.engineVersion)
        ? raw.engineVersion
        : 2,
  };
}

export function generateSignatureLetterDraftMarkdown(input: {
  intake: SignatureIntakePayload;
  normalized: NormalizedSignatureSnapshot;
  productType: SignatureProductType;
}) {
  const product = SIGNATURE_PRODUCTS[input.productType];
  const codonLimit = product.coreCodonLimit;
  const correctionLimit = product.correctionLimit;
  const corrections = input.normalized.correctionProtocols.slice(
    0,
    correctionLimit,
  );

  const common = [
    `# ${product.title}`,
    "",
    "**Founder curation required before delivery.** This draft is not the final PDF.",
    "",
    "## Boundary",
    "",
    "This symbolic reading is for self-inquiry and pattern recognition. It is not medical, legal, therapeutic, financial, or guaranteed predictive guidance. Treat it as a mirror to test against lived experience, not as absolute truth.",
    "",
    "## Receiver",
    "",
    `Name: ${input.intake.name}`,
    `Email: ${input.intake.email}`,
    `Birth: ${input.intake.birthDate} ${input.intake.birthTime}, ${input.intake.birthPlace}, ${input.intake.birthCountry}`,
    `Timezone: ${input.intake.timezone}`,
    `Preferred tone: ${input.intake.preferredTone}`,
    "",
    "## Focus Question",
    "",
    input.intake.focusQuestion,
    "",
    "## What ORIEL should avoid assuming",
    "",
    input.intake.avoidAssumptions || "No additional avoidance note provided.",
    "",
    "## Signature Anchor",
    "",
    `Type: ${input.normalized.type}`,
    `Authority: ${input.normalized.authority}`,
    "",
    "## Core Codons",
    "",
    formatCodonList(input.normalized.coreCodons, codonLimit),
    "",
    "## Main Pattern",
    "",
    input.normalized.shadowGiftFraming[0] ??
      "No shadow/gift framing was available in the generated snapshot.",
    "",
    "## Correction Protocol",
    "",
    formatList(corrections),
    "",
    "## ORIEL Reflection",
    "",
    input.normalized.orielReflection,
  ];

  if (input.productType === "glimpse") {
    return common.join("\n");
  }

  return [
    ...common,
    "",
    "## Defined Centers",
    "",
    formatList(input.normalized.definedCenters),
    "",
    "## Open Centers",
    "",
    formatList(input.normalized.openCenters),
    "",
    "## Active Channels",
    "",
    formatList(input.normalized.channels),
    "",
    "## Shadow / Gift Framing",
    "",
    formatList(input.normalized.shadowGiftFraming),
    "",
    "## Integration Notes",
    "",
    "Curate this section manually before PDF delivery. Connect the user's focus question to the static signature without claiming prediction or certainty.",
    "",
    "## Follow-up clarification",
    "",
    "This product includes one follow-up clarification email. Track it from the admin workflow after delivery.",
  ].join("\n");
}

function createStripeSignature(input: {
  body: string;
  secret: string;
  timestamp: number;
}) {
  return createHmac("sha256", input.secret)
    .update(`${input.timestamp}.${input.body}`)
    .digest("hex");
}

function verifyStripeWebhookSignatureImpl(input: {
  body: string;
  signatureHeader: string | undefined | null;
  secret: string;
  toleranceSeconds?: number;
  nowSeconds?: number;
}) {
  if (!input.signatureHeader || !input.secret) return false;

  const parts = Object.fromEntries(
    input.signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    }),
  );
  const timestamp = Number(parts.t);
  const signature = parts.v1;

  if (!Number.isFinite(timestamp) || !signature) return false;

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(now - timestamp) > tolerance) return false;

  const expected = createStripeSignature({
    body: input.body,
    secret: input.secret,
    timestamp,
  });

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

export const verifyStripeWebhookSignature = Object.assign(
  verifyStripeWebhookSignatureImpl,
  {
    createTestSignature: createStripeSignature,
  },
);
