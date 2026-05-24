import express from "express";
import Stripe from "stripe";
import { db, eq, user } from "@polokaz/db";
import {
  createWebhookEvent,
  isWebhookProcessed,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../../services/webhooks";
import { useWebhookLogger } from "../../logger";
import { PRICE_IDS, stripe } from "../../services/stripe.service";

const router = express.Router();
const logger = useWebhookLogger();
type MembershipTier = "free" | "basic" | "gold" | "merchant";

/**
 * Stripe webhook handler mounted at /api/webhooks/stripe
 */
router.post("/", async (req: any, res) => {
  const stripeSignature = (req.headers["stripe-signature"] as string) ?? (req.headers["Stripe-Signature"] as string);

  const rawBody = (req as any).rawBody ?? (typeof req.body === "string" ? req.body : JSON.stringify(req.body));

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("Missing STRIPE_WEBHOOK_SECRET env var for webhook verification.");
    return res.status(500).send("Webhook secret not configured");
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(rawBody, stripeSignature ?? "", webhookSecret);
  } catch (err: any) {
    logger.error("Failed to verify Stripe webhook signature.", { error: err?.message ?? String(err) });
    return res.status(400).send(`Webhook Error: ${err?.message ?? String(err)}`);
  }

  try {
    const already = await isWebhookProcessed("stripe", event.id);
    if (already) {
      return res.status(200).send("ok");
    }
  } catch (e) {
    logger.error("Failed checking webhook processed state", { error: (e as any)?.message ?? String(e) });
  }

  let webhookRecord: any = null;
  try {
    webhookRecord = await createWebhookEvent({
      source: "stripe",
      eventId: event.id,
      eventType: event.type,
      payload: event,
      headers: Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, typeof v === "string" ? v : Array.isArray(v) ? v.join(",") : String(v)])),
      signature: stripeSignature,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
  } catch (e) {
    logger.error("Failed to create webhook event record", { error: (e as any)?.message ?? String(e) });
  }

  // Respond immediately
  res.status(200).send("ok");

  (async () => {
    const markFailed = async (errMsg: string) => {
      try {
        if (webhookRecord) await updateWebhookEventStatus(webhookRecord.id, "failed", errMsg);
        await logWebhookStep(webhookRecord?.id ?? "", "error", errMsg);
      } catch (e) {
        logger.error("Failed marking webhook as failed", { error: (e as any)?.message ?? String(e) });
      }
    };

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;

          const userId = session.metadata?.userId as string | undefined;
          const customerId = (session.customer as string) ?? null;
          const subscriptionId = (session.subscription as string) ?? null;

          if (!userId) {
            await logWebhookStep(webhookRecord?.id ?? "", "warn", "checkout.session.completed missing metadata.userId", { sessionId: session.id });
            break;
          }

          let tier: MembershipTier = "free";

          try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id as string);
            const priceId = lineItems.data?.[0]?.price?.id;

            const tierMap: Record<string | undefined, string> = {
              [PRICE_IDS.basic ?? ""]: "basic",
              [PRICE_IDS.gold ?? ""]: "gold",
              [PRICE_IDS.merchant ?? ""]: "merchant",
            };

            tier = tierMap[priceId] ?? (session.metadata?.tier as string) ?? "free";
          } catch (e) {
            await logWebhookStep(webhookRecord?.id ?? "", "warn", "Failed to determine tier from line items", { error: (e as any)?.message ?? String(e) });
          }

          try {
            await db
              .update(user)
              .set({ tier, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId })
              .where(eq(user.id, userId));

            await updateWebhookEventStatus(webhookRecord?.id ?? "", "processed");
            await logWebhookStep(webhookRecord?.id ?? "", "info", "Processed checkout.session.completed", { userId, tier, subscriptionId });
          } catch (e) {
            await markFailed(`Failed updating user after checkout completion: ${(e as any)?.message ?? String(e)}`);
          }

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as any;

          const subscriptionId = subscription.id;
          const customerId = subscription.customer as string | null;

          let tier: MembershipTier = "free";
          try {
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const tierMap: Record<string | undefined, string> = {
              [PRICE_IDS.basic ?? ""]: "basic",
              [PRICE_IDS.gold ?? ""]: "gold",
              [PRICE_IDS.merchant ?? ""]: "merchant",
            };
            tier = tierMap[priceId] ?? subscription.metadata?.tier ?? "free";
          } catch (e) {
            await logWebhookStep(webhookRecord?.id ?? "", "warn", "Failed to determine tier from subscription items", { error: (e as any)?.message ?? String(e) });
          }

          try {
            if (customerId) {
              await db
                .update(user)
                .set({ tier, stripeSubscriptionId: subscriptionId })
                .where(eq(user.stripeCustomerId, customerId));
            }

            await updateWebhookEventStatus(webhookRecord?.id ?? "", "processed");
            await logWebhookStep(webhookRecord?.id ?? "", "info", "Processed customer.subscription.updated", { subscriptionId, tier });
          } catch (e) {
            await markFailed(`Failed processing subscription.updated: ${(e as any)?.message ?? String(e)}`);
          }

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;
          const subscriptionId = subscription.id;

          try {
            await db
              .update(user)
              .set({ tier: "free", stripeSubscriptionId: null })
              .where(eq(user.stripeSubscriptionId, subscriptionId));

            await updateWebhookEventStatus(webhookRecord?.id ?? "", "processed");
            await logWebhookStep(webhookRecord?.id ?? "", "info", "Processed customer.subscription.deleted", { subscriptionId });
          } catch (e) {
            await markFailed(`Failed processing subscription.deleted: ${(e as any)?.message ?? String(e)}`);
          }

          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription as string | null;

          try {
            await logWebhookStep(webhookRecord?.id ?? "", "warn", "invoice.payment_failed received", { invoiceId: invoice.id, subscriptionId });
            await updateWebhookEventStatus(webhookRecord?.id ?? "", "processed");
          } catch (e) {
            await markFailed(`Failed processing invoice.payment_failed: ${(e as any)?.message ?? String(e)}`);
          }

          break;
        }

        default: {
          await logWebhookStep(webhookRecord?.id ?? "", "debug", "Unhandled stripe event type", { type: event.type });
          await updateWebhookEventStatus(webhookRecord?.id ?? "", "skipped");
        }
      }
    } catch (e) {
      await markFailed(`Unexpected processing error: ${(e as any)?.message ?? String(e)}`);
    }
  })();
});

export { router as stripeWebhookRouter };
