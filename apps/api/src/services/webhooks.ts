import { db } from "@polokaz/db";
import { webhookEvent, webhookLog } from "@polokaz/db";
import { eq, and } from "drizzle-orm";
import { useWebhookLogger } from "../logger";

const logger = useWebhookLogger();

export type WebhookSource = "stripe" | "coupontools" | "trackdesk";

export interface WebhookEventData {
  source: WebhookSource;
  eventId: string;
  eventType: string;
  payload: any;
  headers?: Record<string, string>;
  signature?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Check if webhook event has already been processed (idempotency check)
 */
export async function isWebhookProcessed(
  source: WebhookSource,
  eventId: string
): Promise<boolean> {
  const existing = await db
    .select()
    .from(webhookEvent)
    .where(
      and(
        eq(webhookEvent.source, source),
        eq(webhookEvent.eventId, eventId)
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Create a new webhook event record
 */
export async function createWebhookEvent(data: WebhookEventData) {
  const [event] = await db
    .insert(webhookEvent)
    .values({
      source: data.source,
      eventId: data.eventId,
      eventType: data.eventType,
      payload: JSON.stringify(data.payload),
      headers: data.headers ? JSON.stringify(data.headers) : null,
      signature: data.signature,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      status: "pending",
      verified: false,
    })
    .returning();

  logger.info(`Webhook event created: ${data.source}/${data.eventType}`, {
    eventId: data.eventId,
    webhookEventId: event.id,
  });

  return event;
}

/**
 * Update webhook event status
 */
export async function updateWebhookEventStatus(
  webhookEventId: string,
  status: "processing" | "processed" | "failed" | "skipped",
  error?: string
) {
  const updates: any = {
    status,
    updatedAt: new Date(),
  };

  if (status === "processed") {
    updates.processedAt = new Date();
  }

  if (error) {
    updates.error = error;
  }

  await db
    .update(webhookEvent)
    .set(updates)
    .where(eq(webhookEvent.id, webhookEventId));

  logger.info(`Webhook event status updated: ${status}`, {
    webhookEventId,
    error,
  });
}

/**
 * Log webhook processing step
 */
export async function logWebhookStep(
  webhookEventId: string,
  level: "info" | "warn" | "error" | "debug",
  message: string,
  context?: any
) {
  await db.insert(webhookLog).values({
    webhookEventId,
    level,
    message,
    context: context ? JSON.stringify(context) : null,
  });

  // Also log to console
  logger[level](message, { webhookEventId, ...context });
}

/**
 * Increment webhook retry attempt
 */
export async function incrementWebhookAttempt(webhookEventId: string) {
  const [event] = await db
    .select()
    .from(webhookEvent)
    .where(eq(webhookEvent.id, webhookEventId))
    .limit(1);

  if (!event) {
    throw new Error(`Webhook event not found: ${webhookEventId}`);
  }

  const newAttempts = event.attempts + 1;
  const shouldRetry = newAttempts < event.maxAttempts;

  const updates: any = {
    attempts: newAttempts,
    updatedAt: new Date(),
  };

  if (shouldRetry) {
    // Exponential backoff: 1min, 5min, 15min
    const delayMinutes = Math.pow(5, newAttempts - 1);
    updates.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);
  } else {
    updates.status = "failed";
  }

  await db
    .update(webhookEvent)
    .set(updates)
    .where(eq(webhookEvent.id, webhookEventId));

  return shouldRetry;
}

/**
 * Get pending webhook events for retry
 */
export async function getPendingWebhookRetries() {
  const now = new Date();

  return await db
    .select()
    .from(webhookEvent)
    .where(
      and(
        eq(webhookEvent.status, "pending"),
        // nextRetryAt is not null and is in the past
        // @ts-ignore - Drizzle typing issue with timestamp comparisons
        webhookEvent.nextRetryAt <= now
      )
    );
}

