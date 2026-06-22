import express from "express";
import crypto from "crypto";
import { db, eq, and, referralUse, referral, referralConversions, commissions } from "@polokaz/db";
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
 * Helper to synchronize Trackdesk status with local commissions and referral use
 */
async function updateLocalCommissionStatus(
  webhookEventId: string,
  conversionId: string,
  status: "approved" | "rejected" | "pending"
) {
  await logWebhookStep(webhookEventId, "info", `Updating local commission for conversion ${conversionId} to ${status}`);

  // 1. Try to find if conversionId corresponds to a referralUse record (Signup conversion)
  const [useRecord] = await db
    .select()
    .from(referralUse)
    .where(eq(referralUse.id, conversionId))
    .limit(1);

  if (useRecord) {
    // Update referralUse status
    await db
      .update(referralUse)
      .set({
        trackdeskStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(referralUse.id, useRecord.id));

    // Look up the referrer
    const [referralRecord] = await db
      .select({ createdBy: referral.createdBy })
      .from(referral)
      .where(eq(referral.id, useRecord.referralId))
      .limit(1);

    if (referralRecord) {
      const referrerId = referralRecord.createdBy;

      // Find the referralConversions record linking referrer and referred user
      const [conversionRecord] = await db
        .select({ id: referralConversions.id })
        .from(referralConversions)
        .where(
          and(
            eq(referralConversions.referrerId, referrerId),
            eq(referralConversions.referredUserId, useRecord.usedBy)
          )
        )
        .limit(1);

      if (conversionRecord) {
        // Update local commission status
        const updatedCommissions = await db
          .update(commissions)
          .set({
            status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
          })
          .where(
            and(
              eq(commissions.referenceId, conversionRecord.id),
              eq(commissions.userId, referrerId)
            )
          )
          .returning();

        await logWebhookStep(webhookEventId, "info", `Updated signup commission status`, {
          referralConversionId: conversionRecord.id,
          referrerId,
          count: updatedCommissions.length,
        });
      }
    }
  } else {
    // 2. If not found in referralUse, conversionId is likely a referred user's ID (Subscription conversion)
    const [conversionRecord] = await db
      .select({ id: referralConversions.id, referrerId: referralConversions.referrerId })
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, conversionId))
      .limit(1);

    if (conversionRecord && conversionRecord.referrerId) {
      const referrerId = conversionRecord.referrerId;

      // Update subscription commission status where referenceId = referred user ID
      const updatedCommissions = await db
        .update(commissions)
        .set({
          status: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending",
        })
        .where(
          and(
            eq(commissions.referenceId, conversionId),
            eq(commissions.userId, referrerId),
            eq(commissions.reason, "referral_subscription")
          )
        )
        .returning();

      await logWebhookStep(webhookEventId, "info", `Updated subscription commission status`, {
        referredUserId: conversionId,
        referrerId,
        count: updatedCommissions.length,
      });
    } else {
      await logWebhookStep(webhookEventId, "warn", `No referralUse or referralConversions record matches conversionId ${conversionId}`);
    }
  }
}

/**
 * Handle conversion.updated event
 */
async function handleConversionUpdated(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing conversion.updated", {
    conversionId: data.conversion_id,
    status: data.status,
  });

  const conversionId = data.conversion_id;
  const rawStatus = data.status;
  
  let mappedStatus: "approved" | "rejected" | "pending" = "pending";
  if (rawStatus === "approved" || rawStatus === "CONVERSION_STATUS_APPROVED") {
    mappedStatus = "approved";
  } else if (rawStatus === "rejected" || rawStatus === "CONVERSION_STATUS_REJECTED") {
    mappedStatus = "rejected";
  }

  await updateLocalCommissionStatus(webhookEventId, conversionId, mappedStatus);
}

/**
 * Handle commission.approved event
 */
async function handleCommissionApproved(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing commission.approved", {
    conversionId: data.conversion_id,
  });

  const conversionId = data.conversion_id;
  await updateLocalCommissionStatus(webhookEventId, conversionId, "approved");
}

/**
 * Handle commission.rejected event
 */
async function handleCommissionRejected(webhookEventId: string, data: any) {
  await logWebhookStep(webhookEventId, "info", "Processing commission.rejected", {
    conversionId: data.conversion_id,
  });

  const conversionId = data.conversion_id;
  await updateLocalCommissionStatus(webhookEventId, conversionId, "rejected");
}

export { router as trackdeskWebhookRouter };

