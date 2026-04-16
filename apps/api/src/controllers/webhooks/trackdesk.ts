import express from "express";
import crypto from "crypto";
import { db, eq, referralUse } from "@polokaz/db";
import {
  isWebhookProcessed,
  createWebhookEvent,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../../services/webhooks";
import { useWebhookLogger } from "../../logger";

const router = express.Router();
const logger = useWebhookLogger();

const TRACKDESK_WEBHOOK_SECRET = process.env.TRACKDESK_WEBHOOK_SECRET;

/**
 * Verify Trackdesk webhook signature
 */
function verifyTrackdeskSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

/**
 * Trackdesk Webhook Handler
 * Handles conversion status updates from Trackdesk
 */
router.post("/", async (req, res) => {
  try {
    const signature = req.headers["x-trackdesk-signature"] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!TRACKDESK_WEBHOOK_SECRET) {
      logger.error("TRACKDESK_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature || !verifyTrackdeskSignature(payload, signature, TRACKDESK_WEBHOOK_SECRET)) {
      logger.warn("Invalid Trackdesk webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body;
    const eventType = event.type;
    const eventId = event.id;

    logger.info("Received Trackdesk webhook", {
      eventType,
      eventId,
    });

    // Check for duplicate events
    const alreadyProcessed = await isWebhookProcessed("trackdesk", eventId);
    if (alreadyProcessed) {
      logger.info("Webhook event already processed", { eventId });
      return res.json({ received: true, status: "already_processed" });
    }

    // Create webhook event record
    const webhookEvent = await createWebhookEvent({
      source: "trackdesk",
      eventId,
      eventType,
      payload: event,
      headers: req.headers as Record<string, string>,
      signature,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    // Update status to processing
    await updateWebhookEventStatus(webhookEvent.id, "processing");

    try {
      // Handle different event types
      switch (eventType) {
        case "conversion.created":
          await handleConversionCreated(webhookEvent.id, event.data);
          break;

        case "conversion.updated":
          await handleConversionUpdated(webhookEvent.id, event.data);
          break;

        case "commission.approved":
          await handleCommissionApproved(webhookEvent.id, event.data);
          break;

        case "commission.rejected":
          await handleCommissionRejected(webhookEvent.id, event.data);
          break;

        default:
          await logWebhookStep(
            webhookEvent.id,
            "warn",
            `Unhandled event type: ${eventType}`
          );
          await updateWebhookEventStatus(webhookEvent.id, "skipped");
          return res.json({ received: true, status: "skipped" });
      }

      // Mark as processed
      await updateWebhookEventStatus(webhookEvent.id, "processed");

      return res.json({ received: true, status: "processed" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await logWebhookStep(webhookEvent.id, "error", "Error processing webhook", {
        error: errorMessage,
      });
      await updateWebhookEventStatus(webhookEvent.id, "failed", errorMessage);

      return res.status(500).json({ error: "Webhook processing failed" });
    }
  } catch (error) {
    logger.error("Error handling Trackdesk webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Handle conversion.created event
 */
async function handleConversionCreated(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing conversion.created", {
    conversionId: data.conversion_id,
  });

  // Conversion is created by our API, so we don't need to do anything here
  // Just log it for audit purposes
}

/**
 * Handle conversion.updated event
 */
async function handleConversionUpdated(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing conversion.updated", {
    conversionId: data.conversion_id,
    status: data.status,
  });

  // Update our referral_use record with the new status
  const conversionId = data.conversion_id; // This is our referral_use.id

  await db
    .update(referralUse)
    .set({
      trackdeskStatus: data.status,
      updatedAt: new Date(),
    })
    .where(eq(referralUse.id, conversionId));
}

/**
 * Handle commission.approved event
 */
async function handleCommissionApproved(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing commission.approved", {
    conversionId: data.conversion_id,
  });

  const conversionId = data.conversion_id;

  await db
    .update(referralUse)
    .set({
      trackdeskStatus: "approved",
      updatedAt: new Date(),
    })
    .where(eq(referralUse.id, conversionId));

  // TODO: Create reward ledger entry for the referrer
}

/**
 * Handle commission.rejected event
 */
async function handleCommissionRejected(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing commission.rejected", {
    conversionId: data.conversion_id,
  });

  const conversionId = data.conversion_id;

  await db
    .update(referralUse)
    .set({
      trackdeskStatus: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(referralUse.id, conversionId));
}

export { router as trackdeskWebhookRouter };

