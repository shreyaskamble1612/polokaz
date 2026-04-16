import express from "express";
import crypto from "crypto";
import {
  isWebhookProcessed,
  createWebhookEvent,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../../services/webhooks";
import { DealsService } from "../../services/deals";
import type { CoupontoolsCoupon, CoupontoolsDealPayload } from "../../services/coupontools";
import { useWebhookLogger } from "../../logger";

const router = express.Router();
const logger = useWebhookLogger();

function verifyCoupontoolsHmac(payload: string, signature: string, secret: string): boolean {
  try {
    const hmac = crypto.createHmac("sha256", secret);
    const digest = hmac.update(payload).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

function mapWebhookCouponToDeal(
  campaignId: string,
  coupon: CoupontoolsCoupon
): CoupontoolsDealPayload {
  const id = campaignId.startsWith("cam_") ? campaignId : `cam_${campaignId}`;
  return {
    id,
    title: coupon.title ?? coupon.friendly_name ?? "Deal",
    description: coupon.subtitle,
    category: coupon.tags ?? undefined,
    dealType: "percentage",
    discountValue: coupon.coupon_value,
    merchantName: "Merchant",
    status: "active",
    coupontoolsCouponId: id,
    coupontoolsData: coupon as unknown as Record<string, unknown>,
  };
}

/**
 * Coupontools Webhook Handler
 * Handles coupon_claimed, coupon_validated, coupon_created, coupon_updated, coupon_removed
 * PRD: Webhooks for redemptions and deal sync
 */
router.post("/", async (req, res) => {
  try {
    const signature = req.headers["x-hmac"] as string;
    const payload = JSON.stringify(req.body);
    const secret = process.env.COUPONTOOLS_API_SECRET;

    if (!secret) {
      logger.error("COUPONTOOLS_API_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature || !verifyCoupontoolsHmac(payload, signature, secret)) {
      logger.warn("Invalid Coupontools webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.body as {
      id?: string;
      type?: string;
      datetime?: string;
      campaign?: string;
      coupon?: string | Record<string, unknown>;
      session?: string;
      coupon_code?: string;
      customer?: Record<string, unknown>;
      status?: Record<string, unknown>;
    };

    const eventType = event.type ?? "unknown";
    const eventId = event.id ?? `evt_${Date.now()}`;

    logger.info("Received Coupontools webhook", { eventType, eventId });

    const alreadyProcessed = await isWebhookProcessed("coupontools", eventId);
    if (alreadyProcessed) {
      logger.info("Webhook event already processed", { eventId });
      return res.json({ received: true, status: "already_processed" });
    }

    const webhookEvent = await createWebhookEvent({
      source: "coupontools",
      eventId,
      eventType,
      payload: event,
      headers: req.headers as Record<string, string>,
      signature,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    await updateWebhookEventStatus(webhookEvent.id, "processing");

    try {
      const dealsService = new DealsService();

      switch (eventType) {
        case "coupon_created":
          await handleCouponCreated(webhookEvent.id, event, dealsService);
          break;

        case "coupon_updated":
          await handleCouponUpdated(webhookEvent.id, event, dealsService);
          break;

        case "coupon_removed":
          await handleCouponRemoved(webhookEvent.id, event, dealsService);
          break;

        case "coupon_claimed":
          await handleCouponClaimed(webhookEvent.id, event);
          break;

        case "coupon_validated":
          await handleCouponValidated(webhookEvent.id, event);
          break;

        default:
          await logWebhookStep(
            webhookEvent.id,
            "warn",
            `Unhandled Coupontools event type: ${eventType}`
          );
          await updateWebhookEventStatus(webhookEvent.id, "skipped");
          return res.json({ received: true, status: "skipped" });
      }

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
    logger.error("Error handling Coupontools webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(500).json({ error: "Internal server error" });
  }
});

async function handleCouponCreated(
  webhookEventId: string,
  event: { campaign?: string; coupon?: string | Record<string, unknown> },
  dealsService: DealsService
) {
  const campaignId = event.campaign ?? event.coupon;
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_created missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_created", {
    campaignId,
  });

  const coupon = typeof event.coupon === "object" ? event.coupon : undefined;
  const payload = mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon
  );
  payload.id = String(campaignId);
  payload.coupontoolsCouponId = String(campaignId);

  await dealsService.upsertDeal(payload);
}

async function handleCouponUpdated(
  webhookEventId: string,
  event: { campaign?: string; coupon?: string | Record<string, unknown> },
  dealsService: DealsService
) {
  const campaignId = event.campaign ?? event.coupon;
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_updated missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_updated", {
    campaignId,
  });

  const coupon = typeof event.coupon === "object" ? event.coupon : undefined;
  const payload = mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon
  );
  payload.id = String(campaignId);
  payload.coupontoolsCouponId = String(campaignId);

  await dealsService.upsertDeal(payload);
}

async function handleCouponRemoved(
  webhookEventId: string,
  event: { campaign?: string; coupon?: string },
  dealsService: DealsService
) {
  const campaignId = event.campaign ?? event.coupon;
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_removed missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_removed", {
    campaignId,
  });

  await dealsService.markDealInactive(String(campaignId));
}

async function handleCouponClaimed(webhookEventId: string, event: Record<string, unknown>) {
  await logWebhookStep(webhookEventId, "info", "Processing coupon_claimed", {
    campaign: event.campaign,
    session: event.session,
  });
  // TODO: Create wallet_item or redemption record when wallet/redemption flow is implemented
}

async function handleCouponValidated(webhookEventId: string, event: Record<string, unknown>) {
  await logWebhookStep(webhookEventId, "info", "Processing coupon_validated", {
    campaign: event.campaign,
    session: event.session,
  });
  // TODO: Update redemption status when redemption flow is implemented
}

export { router as coupontoolsWebhookRouter };
