import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * PayPal webhook event types
 */
export type PayPalWebhookEvent = 
  | "BILLING.SUBSCRIPTION.CREATED"
  | "BILLING.SUBSCRIPTION.UPDATED"
  | "BILLING.SUBSCRIPTION.ACTIVATED"
  | "BILLING.SUBSCRIPTION.CANCELLED"
  | "BILLING.SUBSCRIPTION.EXPIRED"
  | "BILLING.SUBSCRIPTION.SUSPENDED"
  | "PAYMENT.CAPTURE.COMPLETED"
  | "PAYMENT.CAPTURE.REFUNDED";

/**
 * PayPal webhook event payload
 */
export interface PayPalWebhookPayload {
  id: string;
  event_type: PayPalWebhookEvent;
  resource: {
    id: string;
    status: string;
    subscriber?: {
      email_address: string;
    };
    custom_id?: string;
    start_time?: string;
    billing_cycles?: Array<{
      pricing_scheme?: {
        fixed_price?: {
          value: string;
          currency_code: string;
        };
      };
    }>;
  };
  create_time: string;
}

/**
 * Handle PayPal webhook events
 */
export async function handlePayPalWebhook(payload: PayPalWebhookPayload): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[PayPal Webhook] Database not available");
    return;
  }

  const subscriptionId = payload.resource.id;
  const eventType = payload.event_type;

  console.log(`[PayPal Webhook] Processing event: ${eventType} for subscription: ${subscriptionId}`);

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
        await handleSubscriptionCreated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.UPDATED":
        await handleSubscriptionUpdated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSubscriptionExpired(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(db, payload);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCompleted(db, payload);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentRefunded(db, payload);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`[PayPal Webhook] Error processing event: ${eventType}`, error);
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  // Parse custom_id format: "user-{userId}"
  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  // Update user subscription in database
  await db.update(users)
    .set({
      paypalSubscriptionId: subscriptionId,
      subscriptionStatus: "free", // Will be activated on BILLING.SUBSCRIPTION.ACTIVATED
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription created for user ${userId}`);
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);
  const startTime = payload.resource.start_time ? new Date(payload.resource.start_time) : new Date();
  const renewalDate = new Date(startTime);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  await db.update(users)
    .set({
      subscriptionStatus: "active",
      paypalSubscriptionId: subscriptionId,
      subscriptionStartDate: startTime,
      subscriptionRenewalDate: renewalDate,
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription activated for user ${userId}`);
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;
  const status = payload.resource.status;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  // Map PayPal status to our subscription status
  let subscriptionStatus = "active";
  if (status === "SUSPENDED") {
    subscriptionStatus = "cancelled";
  } else if (status === "EXPIRED") {
    subscriptionStatus = "expired";
  }

  await db.update(users)
    .set({
      subscriptionStatus,
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription updated for user ${userId}, status: ${subscriptionStatus}`);
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  await db.update(users)
    .set({
      subscriptionStatus: "cancelled",
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription cancelled for user ${userId}`);
}

/**
 * Handle subscription expiration
 */
async function handleSubscriptionExpired(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  await db.update(users)
    .set({
      subscriptionStatus: "expired",
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription expired for user ${userId}`);
}

/**
 * Handle subscription suspension
 */
async function handleSubscriptionSuspended(db: any, payload: PayPalWebhookPayload): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(`[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`);
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  await db.update(users)
    .set({
      subscriptionStatus: "cancelled",
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription suspended for user ${userId}`);
}

/**
 * Handle payment completion
 */
async function handlePaymentCompleted(db: any, payload: PayPalWebhookPayload): Promise<void> {
  console.log(`[PayPal Webhook] Payment completed: ${payload.resource.id}`);
  // Additional payment processing logic can be added here
}

/**
 * Handle payment refund
 */
async function handlePaymentRefunded(db: any, payload: PayPalWebhookPayload): Promise<void> {
  console.log(`[PayPal Webhook] Payment refunded: ${payload.resource.id}`);
  // Additional refund processing logic can be added here
}
