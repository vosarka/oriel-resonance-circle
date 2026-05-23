import express, { type Express } from "express";

import { handleSignatureStripeWebhook } from "./signature-letter-webhook";

export function registerSignatureStripeWebhookRoute(app: Express) {
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleSignatureStripeWebhook,
  );
}
