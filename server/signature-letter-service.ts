import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { ENV } from "./_core/env";
import { sendSignatureLetterDeliveryEmail } from "./_core/mailer";
import * as db from "./db";
import { geocodeCity, getTimezoneForCoords } from "./geocoding";
import { storageGet, storagePut } from "./storage";
import { buildUserStaticProfile } from "./static-profile-service";
import {
  SIGNATURE_PRODUCTS,
  assertCanAccessIntake,
  assertCanGenerateSnapshot,
  assertCanMarkDelivered,
  buildStripeCheckoutSessionRequest,
  generateSignatureLetterDraftMarkdown,
  normalizeSignatureSnapshot,
  type NormalizedSignatureSnapshot,
  type SignatureIntakePayload,
  type SignatureProductType,
} from "./signature-letter-system";

const MAX_FINAL_PDF_BYTES = 15 * 1024 * 1024;

function requireStripeSecret() {
  if (!ENV.stripeSecretKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "STRIPE_SECRET_KEY is required for checkout.",
    });
  }
}

function requireAppBaseUrl() {
  if (!ENV.appBaseUrl) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "APP_BASE_URL is required for Signature Letter delivery links.",
    });
  }
  return ENV.appBaseUrl.replace(/\/+$/, "");
}

function requirePdfStorageConfig() {
  if (!ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "S3 storage is required before uploading final PDFs.",
    });
  }
}

function assertOwner<T extends { userId: number }>(
  order: T | null,
  userId: number,
): asserts order is T {
  if (!order || order.userId !== userId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Signature Letter order not found.",
    });
  }
}

function assertAdminOrder<T>(order: T | null | undefined): asserts order is T {
  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Signature Letter order not found.",
    });
  }
}

function intakePayloadFromRow(
  intake: Awaited<ReturnType<typeof db.getSignatureIntakeByOrderId>>,
): SignatureIntakePayload {
  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Signature intake is missing.",
    });
  }

  return {
    name: intake.name,
    email: intake.email,
    birthDate: intake.birthDate,
    birthTime: intake.birthTime,
    birthPlace: intake.birthPlace,
    birthCountry: intake.birthCountry,
    timezone: intake.timezone,
    focusQuestion: intake.focusQuestion,
    preferredTone: intake.preferredTone,
    avoidAssumptions: intake.avoidAssumptions ?? "",
    consentAccepted: intake.consentAccepted,
  };
}

function normalizedSnapshotFromRow(
  snapshot: Awaited<ReturnType<typeof db.getLatestSignatureSnapshot>>,
): NormalizedSignatureSnapshot {
  if (!snapshot?.normalizedSignatureJson) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Signature snapshot is missing normalized data.",
    });
  }

  return snapshot.normalizedSignatureJson as NormalizedSignatureSnapshot;
}

async function fetchStripeCheckoutSession(
  payload: ReturnType<typeof buildStripeCheckoutSessionRequest>,
) {
  requireStripeSecret();

  const body = new URLSearchParams();
  body.set("mode", payload.mode);
  body.set("success_url", payload.success_url);
  body.set("cancel_url", payload.cancel_url);
  body.set("client_reference_id", payload.client_reference_id);
  if (payload.customer_email) {
    body.set("customer_email", payload.customer_email);
  }
  payload.line_items.forEach((lineItem, index) => {
    const prefix = `line_items[${index}]`;
    body.set(`${prefix}[quantity]`, String(lineItem.quantity));

    if ("price" in lineItem) {
      body.set(`${prefix}[price]`, lineItem.price);
      return;
    }

    body.set(`${prefix}[price_data][currency]`, lineItem.price_data.currency);
    body.set(
      `${prefix}[price_data][product_data][name]`,
      lineItem.price_data.product_data.name,
    );
    body.set(
      `${prefix}[price_data][product_data][description]`,
      lineItem.price_data.product_data.description,
    );
    body.set(
      `${prefix}[price_data][unit_amount]`,
      String(lineItem.price_data.unit_amount),
    );
  });
  Object.entries(payload.metadata).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.id || !json.url) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: json.error?.message ?? "Stripe Checkout Session failed.",
    });
  }

  return { id: json.id, url: json.url };
}

export async function createSignatureCheckout(input: {
  userId: number;
  userEmail?: string | null;
  productType: SignatureProductType;
}) {
  const product = SIGNATURE_PRODUCTS[input.productType];
  const appBaseUrl = requireAppBaseUrl();
  requireStripeSecret();
  const order = await db.createSignatureOrder({
    userId: input.userId,
    productType: input.productType,
    priceEur: product.priceEur,
    currency: product.currency,
    status: "pending_payment",
  });

  const payload = buildStripeCheckoutSessionRequest({
    appBaseUrl,
    orderId: order.id,
    productType: input.productType,
    userId: input.userId,
    customerEmail: input.userEmail,
  });
  const session = await fetchStripeCheckoutSession(payload);
  await db.setSignatureOrderCheckoutSession({
    orderId: order.id,
    userId: input.userId,
    checkoutSessionId: session.id,
  });

  return {
    orderId: order.id,
    checkoutSessionId: session.id,
    url: session.url,
  };
}

export async function getSignatureOrderBundleForUser(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);

  return {
    order,
    intake: await db.getSignatureIntakeByOrderId(input.orderId),
    snapshot: await db.getLatestSignatureSnapshot(input.orderId),
    draft: await db.getSignatureLetterDraft(input.orderId),
  };
}

export async function submitSignatureIntake(input: {
  orderId: number;
  userId: number;
  intake: SignatureIntakePayload;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertCanAccessIntake(order.status);

  if (!input.intake.consentAccepted) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Consent is required before ORIEL can prepare this reading.",
    });
  }

  await db.upsertSignatureIntake({
    orderId: input.orderId,
    userId: input.userId,
    name: input.intake.name,
    email: input.intake.email,
    birthDate: input.intake.birthDate,
    birthTime: input.intake.birthTime,
    birthPlace: input.intake.birthPlace,
    birthCountry: input.intake.birthCountry,
    timezone: input.intake.timezone,
    focusQuestion: input.intake.focusQuestion,
    preferredTone: input.intake.preferredTone,
    avoidAssumptions: input.intake.avoidAssumptions || null,
    consentAccepted: true,
    consentAcceptedAt: new Date(),
    locationResolutionStatus: "unresolved",
  });

  return getSignatureOrderBundleForUser(input);
}

export async function listSignatureLetterAdminOrders() {
  const orders = await db.listSignatureOrders(200);
  return Promise.all(
    orders.map(async (order) => ({
      order,
      intake: await db.getSignatureIntakeByOrderId(order.id),
      snapshot: await db.getLatestSignatureSnapshot(order.id),
      draft: await db.getSignatureLetterDraft(order.id),
    })),
  );
}

export async function getSignatureLetterAdminOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  return {
    order,
    intake: await db.getSignatureIntakeByOrderId(orderId),
    snapshot: await db.getLatestSignatureSnapshot(orderId),
    draft: await db.getSignatureLetterDraft(orderId),
  };
}

export async function generateSignatureSnapshotForOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  assertCanGenerateSnapshot({
    status: order.status,
    intakeReceived: Boolean(intake),
    consentAccepted: Boolean(intake?.consentAccepted),
  });

  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Intake is required before snapshot generation.",
    });
  }

  let latitude = intake.latitude;
  let longitude = intake.longitude;

  if (latitude === null || longitude === null) {
    try {
      const location = await geocodeCity(
        `${intake.birthPlace}, ${intake.birthCountry}`,
      );
      latitude = location.latitude;
      longitude = location.longitude;
      await db.updateSignatureIntakeLocation({
        orderId,
        latitude,
        longitude,
        locationResolutionStatus: "resolved",
      });
    } catch (error) {
      await db.updateSignatureIntakeLocation({
        orderId,
        latitude: null,
        longitude: null,
        locationResolutionStatus: "failed",
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          error instanceof Error
            ? error.message
            : "Birth location could not be resolved.",
      });
    }
  }

  const birthDate = new Date(intake.birthDate);
  const timezone = getTimezoneForCoords(latitude, longitude, birthDate);
  const rawSignature = await buildUserStaticProfile(String(order.userId), {
    birthDate: intake.birthDate,
    birthTime: intake.birthTime,
    birthCity: intake.birthPlace,
    birthCountry: intake.birthCountry,
    latitude,
    longitude,
    timezoneId: intake.timezone || timezone.tzId,
    timezoneOffset: timezone.offsetHours,
  });
  const normalized = normalizeSignatureSnapshot(
    rawSignature,
    order.productType,
  );

  return db.createSignatureSnapshot({
    orderId,
    userId: order.userId,
    rawSignatureJson: JSON.stringify(rawSignature),
    normalizedSignatureJson: JSON.stringify(normalized),
    engineVersion: rawSignature.engineVersion ?? normalized.engineVersion,
  });
}

export async function generateSignatureDraftForOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  const snapshot = await db.getLatestSignatureSnapshot(orderId);

  if (!intake || !snapshot) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Snapshot and intake are required before draft generation.",
    });
  }

  const markdown = generateSignatureLetterDraftMarkdown({
    intake: intakePayloadFromRow(intake),
    normalized: normalizedSnapshotFromRow(snapshot),
    productType: order.productType,
  });

  const draft = await db.upsertSignatureLetterDraft({
    orderId,
    userId: order.userId,
    markdown,
    productType: order.productType,
    status: "draft_ready",
  });

  if (order.productType === "founding") {
    await db.upsertSignatureFollowup({
      orderId,
      userId: order.userId,
      used: false,
    });
  }

  return draft;
}

export async function saveSignatureDraft(input: {
  orderId: number;
  markdown: string;
}) {
  await db.updateSignatureLetterDraftMarkdown(input);
  return db.getSignatureLetterDraft(input.orderId);
}

export async function markSignatureInCuration(orderId: number) {
  await db.markSignatureLetterDraftStatus({
    orderId,
    status: "in_curation",
  });
  return getSignatureLetterAdminOrder(orderId);
}

export async function uploadFinalSignaturePdf(input: {
  orderId: number;
  fileName: string;
  mimeType: string;
  base64: string;
}) {
  requirePdfStorageConfig();

  if (input.mimeType !== "application/pdf") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only PDF files can be uploaded.",
    });
  }

  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.byteLength > MAX_FINAL_PDF_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Final PDF must be 15MB or smaller.",
    });
  }

  const order = await db.getSignatureOrderById(input.orderId);
  assertAdminOrder(order);
  const storageKey = `signature-letters/${input.orderId}/${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await storagePut(storageKey, buffer, input.mimeType);
  await db.setSignatureLetterDraftPdf({
    orderId: input.orderId,
    storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  return getSignatureLetterAdminOrder(input.orderId);
}

export async function markSignatureDelivered(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  const draft = await db.getSignatureLetterDraft(orderId);
  assertCanMarkDelivered({
    status: order.status,
    finalPdfStorageKey: draft?.finalPdfStorageKey,
  });

  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot deliver without intake email.",
    });
  }

  await db.markSignatureLetterDraftStatus({
    orderId,
    status: "delivered",
  });

  await sendSignatureLetterDeliveryEmail({
    email: intake.email,
    name: intake.name,
    productTitle: SIGNATURE_PRODUCTS[order.productType].title,
    deliveryUrl: `${requireAppBaseUrl()}/signature-intake/${orderId}`,
  });

  return getSignatureLetterAdminOrder(orderId);
}

export async function markSignatureFollowupUsed(input: {
  orderId: number;
  notes?: string | null;
}) {
  const order = await db.getSignatureOrderById(input.orderId);
  assertAdminOrder(order);
  await db.upsertSignatureFollowup({
    orderId: input.orderId,
    userId: order.userId,
    used: true,
    notes: input.notes,
  });
  return getSignatureLetterAdminOrder(input.orderId);
}

export async function getFinalSignaturePdfUrl(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  const draft = await db.getSignatureLetterDraft(input.orderId);

  if (!draft?.finalPdfStorageKey) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Final PDF is not ready yet.",
    });
  }

  return storageGet(draft.finalPdfStorageKey);
}
