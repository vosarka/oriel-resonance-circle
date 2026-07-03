import type { Request, Response } from "express";

import { ENV } from "./_core/env";
import * as db from "./db";
import { verifyStripeWebhookSignature } from "./signature-letter-system";

type StripeWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      client_reference_id?: string;
      payment_intent?: string | null;
      metadata?: {
        orderId?: string;
      };
    };
  };
};

function parseOrderId(event: StripeWebhookEvent) {
  const object = event.data?.object;
  const raw = object?.metadata?.orderId ?? object?.client_reference_id;
  const orderId = Number(raw);
  return Number.isInteger(orderId) && orderId > 0 ? orderId : null;
}

export async function handleSignatureStripeWebhook(
  req: Request,
  res: Response
) {
  const body = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : String(req.body ?? "");
  const signatureHeader = req.header("stripe-signature");

  if (
    !verifyStripeWebhookSignature({
      body,
      signatureHeader,
      secret: ENV.stripeWebhookSecret,
    })
  ) {
    res.status(400).json({ error: "Invalid Stripe webhook signature." });
    return;
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(body) as StripeWebhookEvent;
  } catch {
    res.status(400).json({ error: "Invalid Stripe webhook payload." });
    return;
  }

  const orderId = parseOrderId(event);
  if (!orderId) {
    res.status(200).json({ received: true, ignored: true });
    return;
  }

  const object = event.data?.object;
  if (event.type === "checkout.session.completed") {
    await db.updateSignatureOrderStatus({
      orderId,
      status: "intake_needed",
      stripeCheckoutSessionId: object?.id ?? null,
      stripePaymentIntentId: object?.payment_intent ?? null,
    });
  } else if (event.type === "checkout.session.expired") {
    await db.updateSignatureOrderStatus({
      orderId,
      status: "cancelled",
      stripeCheckoutSessionId: object?.id ?? null,
    });
  }

  res.status(200).json({ received: true });
}
