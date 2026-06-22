import express from "express";
import crypto from "crypto";
import { and, db, deal, eq, or, redemptions, user, walletItems, referralConversions } from "@polokaz/db";
import { DealsService } from "../services/deals";
import { CoupontoolsService, type CoupontoolsCoupon } from "../services/coupontools";
import { isWebhookProcessed, createWebhookEvent, updateWebhookEventStatus, logWebhookStep } from "../services/webhooks";
import { dispatchReward as realDispatchReward, getActiveReferralCount, getAdminSettings } from "../services/rewards.service";
import { TrackdeskService } from "../services/trackdesk";
import { useWebhookLogger } from "../logger";


const router = express.Router();
const logger = useWebhookLogger();

type Redemption = typeof redemptions.$inferSelect;

type CoupontoolsWebhookBody = Record<string, unknown> & {
  id?: string;
  type?: string;
  datetime?: string;
  campaign?: string | Record<string, unknown>;
  campaignId?: string;
  coupon?: string | Record<string, unknown>;
  couponId?: string;
  data?: Record<string, unknown>;
  session?: string;
  coupon_code?: string;
  customer?: Record<string, unknown>;
  status?: Record<string, unknown>;
};

function normalizeHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getSignature(req: express.Request): string | null {
  return (
    normalizeHeaderValue(req.headers["x-coupontools-signature"] as string | string[] | undefined) ||
    normalizeHeaderValue(req.headers["x-coupontools-webhook-signature"] as string | string[] | undefined) ||
    normalizeHeaderValue(req.headers["x-hmac"] as string | string[] | undefined)
  );
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const normalizedSignature = signature.startsWith("sha256=") ? signature.slice(7) : signature;
    const digest = crypto.createHmac("sha256", secret).update(payload).digest("hex");

    if (normalizedSignature.length !== digest.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(normalizedSignature), Buffer.from(digest));
  } catch {
    return false;
  }
}

function getPayloadBody(req: express.Request): string {
  const rawBody = (req as express.Request & { rawBody?: string }).rawBody;
  if (rawBody && rawBody.trim()) return rawBody;
  return JSON.stringify(req.body ?? {});
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" || typeof value === "bigint") {
      return String(value);
    }
  }

  return null;
}

function extractEventId(event: CoupontoolsWebhookBody): string | null {
  const nestedEvent = asRecord(asRecord(event.data)?.event);

  return pickString(
    event.id,
    asRecord(event.data)?.id,
    asRecord(event.data)?.eventId,
    asRecord(event.data)?.event_id,
    nestedEvent?.id,
    nestedEvent?.eventId,
  );
}

function extractRedemptionDetails(event: CoupontoolsWebhookBody) {
  const data = asRecord(event.data);
  const eventData = asRecord(data?.event);
  const customer = asRecord(event.customer) ?? asRecord(data?.customer) ?? asRecord(data?.consumer);

  const couponObject = asRecord(event.coupon) ?? asRecord(data?.coupon);
  const campaignObject = asRecord(event.campaign) ?? asRecord(data?.campaign);

  const coupontoolsCampaignId = pickString(
    event.campaignId,
    event.campaign,
    event.couponId,
    event.coupon,
    data?.coupontoolsCampaignId,
    data?.campaignId,
    data?.campaign_id,
    data?.dealId,
    data?.deal_id,
    data?.couponId,
    data?.coupon_id,
    campaignObject?.id,
    campaignObject?.campaignId,
    campaignObject?.campaign_id,
    campaignObject?.coupon_id,
    couponObject?.id,
    couponObject?.campaignId,
    couponObject?.campaign_id,
    couponObject?.coupon_id,
    eventData?.coupontoolsCampaignId,
    eventData?.campaignId,
    eventData?.campaign_id,
    eventData?.dealId,
    eventData?.deal_id,
    eventData?.couponId,
    eventData?.coupon_id,
  );

  const consumerIdentifier = pickString(
    event.customid as string | undefined,
    customer?.customid as string | undefined,
    data?.customid as string | undefined,
    event.consumerIdentifier,
    event.consumer,
    data?.consumerIdentifier,
    data?.consumer_identifier,
    data?.userId,
    data?.user_id,
    data?.email,
    customer?.email,
    customer?.userId,
    customer?.user_id,
    customer?.identifier,
    customer?.id,
    eventData?.consumerIdentifier,
    eventData?.consumer_identifier,
    eventData?.email,
    eventData?.userId,
    eventData?.user_id,
  );

  const redeemedAt = pickString(
    event.redeemedAt,
    event.redeemed_at,
    data?.redeemedAt,
    data?.redeemed_at,
    data?.redeemTime,
    data?.timestamp,
    data?.datetime,
    eventData?.redeemedAt,
    eventData?.redeemed_at,
    eventData?.timestamp,
    eventData?.datetime,
  );

  return { coupontoolsCampaignId, consumerIdentifier, redeemedAt };
}

function isRedemptionEvent(event: CoupontoolsWebhookBody): boolean {
  const eventType = pickString(event.type, asRecord(event.data)?.type, asRecord(event.data)?.eventType)?.toLowerCase();
  if (eventType && ["coupon_redeemed", "coupon_claimed", "coupon_validated", "redemption", "redemption_created"].includes(eventType)) {
    return true;
  }

  const details = extractRedemptionDetails(event);
  return Boolean(details.coupontoolsCampaignId && details.consumerIdentifier);
}



async function processRedemptionEvent(event: CoupontoolsWebhookBody) {
  const eventId = extractEventId(event);

  if (!eventId) {
    throw Object.assign(new Error("Missing Coupontools event id"), { statusCode: 400 });
  }

  const existingRedemption = await db
    .select({ id: redemptions.id })
    .from(redemptions)
    .where(eq(redemptions.coupontoolsEventId, eventId))
    .limit(1);

  if (existingRedemption.length > 0) {
    return { alreadyProcessed: true as const };
  }

  const { coupontoolsCampaignId, consumerIdentifier, redeemedAt } = extractRedemptionDetails(event);

  if (!coupontoolsCampaignId || !consumerIdentifier) {
    throw Object.assign(new Error("Missing Coupontools redemption payload fields"), { statusCode: 400 });
  }

  const redeemedAtDate = redeemedAt ? new Date(redeemedAt) : new Date();
  if (Number.isNaN(redeemedAtDate.getTime())) {
    throw Object.assign(new Error("Invalid redeemedAt timestamp"), { statusCode: 400 });
  }

  const [dealRow] = await db
    .select()
    .from(deal)
    .where(eq(deal.coupontoolsId, coupontoolsCampaignId))
    .limit(1);

  if (!dealRow) {
    throw Object.assign(new Error("Deal not found for Coupontools campaign"), { statusCode: 404 });
  }

  if (!dealRow.merchantId) {
    throw Object.assign(new Error("Deal is not attached to a merchant"), { statusCode: 409 });
  }

  const merchantId = dealRow.merchantId;

  const [userRow] = await db
    .select()
    .from(user)
    .where(or(eq(user.email, consumerIdentifier), eq(user.id, consumerIdentifier)))
    .limit(1);

  if (!userRow) {
    throw Object.assign(new Error("Consumer not found"), { statusCode: 404 });
  }

  const redemptionRecord = await db.transaction(async (tx) => {
    const [updatedWalletItem] = await tx
      .update(walletItems)
      .set({
        status: "redeemed",
        redeemedAt: new Date(),
      })
      .where(
        and(
          eq(walletItems.userId, userRow.id),
          eq(walletItems.dealId, dealRow.id),
          eq(walletItems.status, "saved"),
        ),
      )
      .returning();

    if (!updatedWalletItem) {
      throw Object.assign(new Error("Saved wallet item not found"), { statusCode: 404 });
    }

    const [createdRedemption] = await tx
      .insert(redemptions)
      .values({
        userId: userRow.id,
        dealId: dealRow.id,
        merchantId,
        coupontoolsEventId: eventId,
        redeemedAt: redeemedAtDate,
        rewardDispatched: false,
      })
      .returning();

    return createdRedemption;
  });

  setImmediate(() => {
    void realDispatchReward({
      type: "deal_redemption",
      userId: userRow.id,
      referenceId: redemptionRecord.id,
    }).catch((error) => {
      logger.error("User deal redemption reward dispatch failed", {
        redemptionId: redemptionRecord.id,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });

  // Check if redeeming user was referred
  try {
    const [referralRecord] = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, redemptionRecord.userId))
      .limit(1);

    if (referralRecord && referralRecord.referrerId) {
      const [referrer] = await db
        .select()
        .from(user)
        .where(eq(user.id, referralRecord.referrerId))
        .limit(1);

      if (referrer) {
        const activeReferrals = await getActiveReferralCount(referrer.id);
        const settings = await getAdminSettings();
        const isQualified = activeReferrals >= settings.referralQualificationLimit;

        if (isQualified) {
          // Non-blocking: dispatch reward
          setImmediate(() => {
            realDispatchReward({
              type: "referral_redemption",
              userId: referrer.id,
              referenceId: redemptionRecord.id,
              amount: 0.50,
            }).catch((err) => {
              logger.error("Referrer redemption reward dispatch failed", {
                redemptionId: redemptionRecord.id,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          });

          // Non-blocking: trackdesk logConversion
          if (referrer.trackdeskAffiliateId) {
            setImmediate(() => {
              const trackdeskService = new TrackdeskService();
              trackdeskService
                .logConversion(
                  referrer.trackdeskAffiliateId!,
                  "referral_redemption",
                  redemptionRecord.id,
                  0.50
                )
                .catch((err) => {
                  logger.error("Failed to log redemption conversion to Trackdesk", {
                    redemptionId: redemptionRecord.id,
                    error: err instanceof Error ? err.message : String(err),
                  });
                });
            });
          }
        } else {
          // Not qualified: dispatch points instead
          setImmediate(() => {
            realDispatchReward({
              type: "referral_redemption",
              userId: referrer.id,
              referenceId: redemptionRecord.id,
            }).catch((err) => {
              logger.error("Referrer redemption points dispatch failed", {
                redemptionId: redemptionRecord.id,
                error: err instanceof Error ? err.message : String(err),
              });
            });
          });
        }
      }
    }
  } catch (err) {
    logger.error("Error processing referral conversion for redemption", {
      redemptionId: redemptionRecord.id,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { redemptionRecord };
}

async function handleCouponCreated(event: CoupontoolsWebhookBody, dealsService: DealsService, webhookEventId: string) {
  const campaignId = pickString(event.campaign, event.coupon, asRecord(event.data)?.campaign, asRecord(event.data)?.coupon);

  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_created missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_created", { campaignId });

  const coupon = asRecord(event.coupon) ?? asRecord(asRecord(event.data)?.coupon);
  const payload = new CoupontoolsService().mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon,
  );

  await dealsService.upsertDeal(payload);
}

async function handleCouponUpdated(event: CoupontoolsWebhookBody, dealsService: DealsService, webhookEventId: string) {
  const campaignId = pickString(event.campaign, event.coupon, asRecord(event.data)?.campaign, asRecord(event.data)?.coupon);

  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_updated missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_updated", { campaignId });

  const coupon = asRecord(event.coupon) ?? asRecord(asRecord(event.data)?.coupon);
  const payload = new CoupontoolsService().mapWebhookCouponToDeal(
    String(campaignId),
    (coupon ?? {}) as CoupontoolsCoupon,
  );

  await dealsService.upsertDeal(payload);
}

async function handleCouponRemoved(event: CoupontoolsWebhookBody, dealsService: DealsService, webhookEventId: string) {
  const campaignId = pickString(
    event.campaign,
    event.coupon,
    asRecord(event.data)?.campaign,
    asRecord(event.data)?.coupon,
  );

  if (!campaignId) {
    await logWebhookStep(webhookEventId, "warn", "coupon_removed missing campaign/coupon");
    return;
  }

  await logWebhookStep(webhookEventId, "info", "Processing coupon_removed", { campaignId });

  await dealsService.markDealInactive(String(campaignId));
}

async function handleWebhookRequest(req: express.Request, res: express.Response) {
  const signature = getSignature(req);
  const secret = process.env.COUPONTOOLS_WEBHOOK_SECRET?.trim();
  const payload = getPayloadBody(req);
  const event = req.body as CoupontoolsWebhookBody;
  const eventType = pickString(event.type, asRecord(event.data)?.type, asRecord(event.data)?.eventType) ?? "unknown";
  const eventId = extractEventId(event);

  if (secret) {
    if (!signature || !verifySignature(payload, signature, secret)) {
      return res.status(400).json({ error: { code: "INVALID_SIGNATURE", message: "Invalid Coupontools signature" } });
    }
  }

  if (isRedemptionEvent(event)) {
    const result = await processRedemptionEvent(event);

    if ("alreadyProcessed" in result) {
      return res.status(200).json({ received: true, status: "already_processed" });
    }

    return res.status(200).json({ received: true, status: "processed" });
  }

  const webhookEventId = eventId ?? `evt_${Date.now()}`;

  const alreadyProcessed = await isWebhookProcessed("coupontools", webhookEventId);
  if (alreadyProcessed) {
    return res.status(200).json({ received: true, status: "already_processed" });
  }

  const webhookEvent = await createWebhookEvent({
    source: "coupontools",
    eventId: webhookEventId,
    eventType,
    payload: event,
    headers: req.headers as Record<string, string>,
    signature: signature ?? undefined,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  await updateWebhookEventStatus(webhookEvent.id, "processing");

  try {
    const dealsService = new DealsService();

    switch (eventType) {
      case "coupon_created":
        await handleCouponCreated(event, dealsService, webhookEvent.id);
        break;
      case "coupon_updated":
        await handleCouponUpdated(event, dealsService, webhookEvent.id);
        break;
      case "coupon_removed":
        await handleCouponRemoved(event, dealsService, webhookEvent.id);
        break;
      case "coupon_claimed":
      case "coupon_validated":
        await logWebhookStep(webhookEvent.id, "info", `Processing ${eventType}`, {
          campaign: event.campaign,
          session: event.session,
        });
        break;
      default:
        await logWebhookStep(webhookEvent.id, "warn", `Unhandled Coupontools event type: ${eventType}`);
        await updateWebhookEventStatus(webhookEvent.id, "skipped");
        return res.status(200).json({ received: true, status: "skipped" });
    }

    await updateWebhookEventStatus(webhookEvent.id, "processed");
    return res.status(200).json({ received: true, status: "processed" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const statusCode = typeof (error as { statusCode?: number }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

    await logWebhookStep(webhookEvent.id, "error", "Error processing Coupontools webhook", {
      error: errorMessage,
    });
    await updateWebhookEventStatus(webhookEvent.id, "failed", errorMessage);

    return res.status(statusCode).json({
      error: {
        code: statusCode === 400 ? "INVALID_REQUEST" : statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
        message: errorMessage,
      },
    });
  }
}

router.post("/coupontools", (req, res) => {
  void handleWebhookRequest(req, res).catch((error) => {
    logger.error("Error handling Coupontools webhook", {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: "Internal server error" });
  });
});

export { router as webhooksRouter };