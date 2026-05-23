import express from "express";
import { createServer } from "http";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateSignatureOrderStatus } = vi.hoisted(() => ({
  updateSignatureOrderStatus: vi.fn(),
}));

vi.mock("./db", () => ({
  updateSignatureOrderStatus,
}));

vi.mock("./_core/env", () => ({
  ENV: {
    stripeWebhookSecret: "whsec_route_test",
  },
}));

import { registerSignatureStripeWebhookRoute } from "./signature-letter-webhook-route";
import { verifyStripeWebhookSignature } from "./signature-letter-system";

function createSignatureHeader(body: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = verifyStripeWebhookSignature.createTestSignature({
    body,
    secret: "whsec_route_test",
    timestamp,
  });

  return `t=${timestamp},v1=${signature}`;
}

async function postWebhook(body: string, signatureHeader: string) {
  const app = express();
  registerSignatureStripeWebhookRoute(app);
  app.use(express.json());

  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Webhook test server did not expose a TCP port.");
  }

  try {
    return await fetch(`http://127.0.0.1:${address.port}/api/stripe/webhook`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": signatureHeader,
      },
      body,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("Signature Letter Stripe webhook route", () => {
  beforeEach(() => {
    updateSignatureOrderStatus.mockReset();
  });

  it("verifies the exact raw request body and marks completed checkout sessions as intake_needed", async () => {
    const body = JSON.stringify(
      {
        id: "evt_completed_91",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_91",
            payment_intent: "pi_test_91",
            metadata: {
              orderId: "91",
            },
          },
        },
      },
      null,
      2,
    );

    const response = await postWebhook(body, createSignatureHeader(body));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(updateSignatureOrderStatus).toHaveBeenCalledTimes(1);
    expect(updateSignatureOrderStatus).toHaveBeenCalledWith({
      orderId: 91,
      status: "intake_needed",
      stripeCheckoutSessionId: "cs_test_91",
      stripePaymentIntentId: "pi_test_91",
    });
  });

  it("falls back to client_reference_id when checkout metadata does not include orderId", async () => {
    const body = JSON.stringify({
      id: "evt_completed_92",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_92",
          client_reference_id: "92",
          payment_intent: "pi_test_92",
          metadata: {},
        },
      },
    });

    const response = await postWebhook(body, createSignatureHeader(body));

    expect(response.status).toBe(200);
    expect(updateSignatureOrderStatus).toHaveBeenCalledWith({
      orderId: 92,
      status: "intake_needed",
      stripeCheckoutSessionId: "cs_test_92",
      stripePaymentIntentId: "pi_test_92",
    });
  });

  it("rejects invalid webhook signatures before touching order state", async () => {
    const body = JSON.stringify({
      id: "evt_bad_signature",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_bad",
          metadata: { orderId: "91" },
        },
      },
    });
    const timestamp = Math.floor(Date.now() / 1000);

    const response = await postWebhook(
      body,
      `t=${timestamp},v1=${"0".repeat(64)}`,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid Stripe webhook signature.",
    });
    expect(updateSignatureOrderStatus).not.toHaveBeenCalled();
  });
});
