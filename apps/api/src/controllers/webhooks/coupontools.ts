import express from "express";
import crypto from "crypto";
import {
  isWebhookProcessed,
  createWebhookEvent,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../../services/webhooks";
import { DealsService } from "../../services/deals";
import { CoupontoolsService, type CoupontoolsCoupon } from "../../services/coupontools";
import { useWebhookLogger } from "../../logger";
import {
  db,
  deal,
  user,
  walletItems,
  redemptions,
  referralConversions,
  merchants,
  eq,
  and,
} from "@polokaz/db";
import { dispatchReward } from "../../services/rewards.service";

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
  const payload = new CoupontoolsService().mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon
  );

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
  const payload = new CoupontoolsService().mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon
  );

  await dealsService.upsertDeal(payload);
}

async function handleCouponRemoved(
  webhookEventId: string,
  event: { campaign?: string; coupon?: string | Record<string, unknown> },
  dealsService: DealsService
) {
  const campaignId =
    event.campaign ?? (typeof event.coupon === "string" ? event.coupon : undefined);
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_removed missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_removed", {
    campaignId,
  });

  await dealsService.markDealInactive(String(campaignId));
}

async function handleCouponClaimed(webhookEventId: string, event: Record<string, any>) {
  await logWebhookStep(webhookEventId, "info", "Processing coupon_claimed", {
    campaign: event.campaign,
    session: event.session,
  });

  const campaignId = event.campaign;
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_claimed missing campaign ID");
    return;
  }

  // Parse user identification
  const customId = typeof event.customid === "string" ? event.customid : event.customer?.customid;
  const email = event.customer?.email;

  let matchedUser;
  if (customId) {
    [matchedUser] = await db.select().from(user).where(eq(user.id, customId)).limit(1);
  }
  if (!matchedUser && email) {
    [matchedUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  }

  if (!matchedUser) {
    await logWebhookStep(webhookEventId, "info", "No matching user found for coupon_claimed", { customId, email });
    return;
  }

  // Find local deal
  const [localDeal] = await db.select().from(deal).where(eq(deal.coupontoolsId, String(campaignId))).limit(1);
  if (!localDeal) {
    await logWebhookStep(webhookEventId, "warn", "No matching deal found in database for campaign", { campaignId });
    return;
  }

  // Check if already in wallet
  const [existingWallet] = await db
    .select()
    .from(walletItems)
    .where(and(eq(walletItems.userId, matchedUser.id), eq(walletItems.dealId, localDeal.id)))
    .limit(1);

  if (!existingWallet) {
    await db.insert(walletItems).values({
      userId: matchedUser.id,
      dealId: localDeal.id,
      status: "saved",
      savedAt: new Date(),
    });
    await logWebhookStep(webhookEventId, "info", "Created wallet item from coupon_claimed", {
      userId: matchedUser.id,
      dealId: localDeal.id,
    });
  } else {
    await logWebhookStep(webhookEventId, "info", "Wallet item already exists for claimed coupon", {
      userId: matchedUser.id,
      dealId: localDeal.id,
    });
  }
}

async function handleCouponValidated(webhookEventId: string, event: Record<string, any>) {
  await logWebhookStep(webhookEventId, "info", "Processing coupon_validated", {
    campaign: event.campaign,
    session: event.session,
  });

  const campaignId = event.campaign;
  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_validated missing campaign ID");
    return;
  }

  // Parse user identification
  const customId = typeof event.customid === "string" ? event.customid : event.customer?.customid;
  const email = event.customer?.email;

  let matchedUser;
  if (customId) {
    [matchedUser] = await db.select().from(user).where(eq(user.id, customId)).limit(1);
  }
  if (!matchedUser && email) {
    [matchedUser] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  }

  if (!matchedUser) {
    await logWebhookStep(webhookEventId, "info", "No matching user found for coupon_validated", { customId, email });
    return;
  }

  // Find local deal
  const [localDeal] = await db.select().from(deal).where(eq(deal.coupontoolsId, String(campaignId))).limit(1);
  if (!localDeal) {
    await logWebhookStep(webhookEventId, "warn", "No matching deal found in database for campaign", { campaignId });
    return;
  }

  // Look up wallet item
  let [walletItemRow] = await db
    .select()
    .from(walletItems)
    .where(and(eq(walletItems.userId, matchedUser.id), eq(walletItems.dealId, localDeal.id)))
    .limit(1);

  if (walletItemRow) {
    await db
      .update(walletItems)
      .set({
        status: "redeemed",
        redeemedAt: new Date(),
      })
      .where(eq(walletItems.id, walletItemRow.id));
  } else {
    // If validated directly on CouponTools, create redeemed wallet item
    [walletItemRow] = await db
      .insert(walletItems)
      .values({
        userId: matchedUser.id,
        dealId: localDeal.id,
        status: "redeemed",
        savedAt: new Date(),
        redeemedAt: new Date(),
      })
      .returning();
  }

  // Resolve merchantId fallback since it is required (NOT NULL) in the redemptions table
  let merchantId = localDeal.merchantId;
  if (!merchantId) {
    const [firstMerchant] = await db.select({ id: merchants.id }).from(merchants).where(eq(merchants.status, "active")).limit(1);
    merchantId = firstMerchant?.id || null;
  }

  if (!merchantId) {
    await logWebhookStep(webhookEventId, "error", "Cannot record redemption: deal has no merchant, and no fallback active merchant was found.");
    return;
  }

  // Create redemption record matching the new schema
  const [redemptionRecord] = await db
    .insert(redemptions)
    .values({
      userId: matchedUser.id,
      dealId: localDeal.id,
      merchantId: merchantId,
      coupontoolsEventId: event.id ? String(event.id) : `event-${crypto.randomUUID()}`,
      redeemedAt: new Date(),
      rewardDispatched: false,
    })
    .returning();

  await logWebhookStep(webhookEventId, "info", "Created redemption log from coupon_validated", {
    redemptionId: redemptionRecord?.id,
  });

  if (redemptionRecord) {
    // 1. Reward the user who redeemed
    await dispatchReward({
      type: "deal_redemption",
      userId: matchedUser.id,
      referenceId: redemptionRecord.id,
    }).catch(err =>
      logger.error("Failed to dispatch reward points from webhook", { error: err.message })
    );

    // 2. Reward the referrer if applicable
    const [conversion] = await db
      .select({ referrerId: referralConversions.referrerId })
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, matchedUser.id))
      .limit(1);

    if (conversion && conversion.referrerId) {
      await dispatchReward({
        type: "referral_redemption",
        userId: conversion.referrerId,
        referenceId: redemptionRecord.id,
      }).catch(err =>
        logger.error("Failed to dispatch referrer reward from webhook", { error: err.message })
      );
    }
  }
}

export { router as coupontoolsWebhookRouter };
