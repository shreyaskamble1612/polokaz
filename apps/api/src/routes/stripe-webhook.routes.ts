import express from "express";
import { db, eq, user, referralConversions } from "@polokaz/db";
import { useWebhookLogger } from "../logger";
import { PRICE_IDS, stripe } from "../services/stripe.service";
import { dispatchReward } from "../services/rewards.service";
import { TrackdeskService } from "../services/trackdesk";

const router = express.Router();
const logger = useWebhookLogger();

type MembershipTier = "free" | "basic" | "gold" | "merchant";

function mapPriceIdToTier(priceId: string | undefined | null): MembershipTier {
  if (priceId) {
    if (priceId === PRICE_IDS.basic.monthly || priceId === PRICE_IDS.basic.yearly) return "basic";
    if (priceId === PRICE_IDS.gold.monthly || priceId === PRICE_IDS.gold.yearly) return "gold";
    if (priceId === PRICE_IDS.merchant.monthly || priceId === PRICE_IDS.merchant.yearly) return "merchant";
  }
  return "free";
}

router.post("/", (req: any, res) => {
  const sig =
    (req.headers["stripe-signature"] as string | undefined) ??
    (req.headers["Stripe-Signature"] as string | undefined);
  const rawBody = req.body as Buffer;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error("Missing STRIPE_WEBHOOK_SECRET env var for webhook verification.");
    return res.status(500).send("Webhook secret not configured");
  }

  if (!sig) {
    return res.status(400).send("Missing Stripe signature");
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (error) {
    logger.error("Failed to verify Stripe webhook signature.", {
      error: error instanceof Error ? error.message : String(error),
    });
    return res.status(400).send("Webhook signature verification failed");
  }

  res.status(200).send("ok");

  void (async () => {
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId as string | undefined;
          const stripeCustomerId = (session.customer as string | null) ?? null;
          const stripeSubscriptionId = (session.subscription as string | null) ?? null;

          if (!userId || !session.id) {
            logger.warn("checkout.session.completed missing user metadata or session id", {
              eventId: event.id,
              userId,
              sessionId: session.id,
            });
            break;
          }

          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          const priceId = lineItems.data?.[0]?.price?.id;
          const tier = mapPriceIdToTier(priceId);

          await db
            .update(user)
            .set({ tier, stripeCustomerId, stripeSubscriptionId, hasSelectedPlan: true })
            .where(eq(user.id, userId));

          // 1. Check if this user was referred: SELECT * FROM referral_conversions WHERE referredUserId = userId
          try {
            const [referralRecord] = await db
              .select()
              .from(referralConversions)
              .where(eq(referralConversions.referredUserId, userId))
              .limit(1);

            // 2. If a referral record exists:
            if (referralRecord && referralRecord.referrerId) {
              // a. Get the referrer: SELECT * FROM user WHERE id = referral_conversions.referrerId
              const [referrer] = await db
                .select()
                .from(user)
                .where(eq(user.id, referralRecord.referrerId))
                .limit(1);

              if (referrer) {
                // b. Calculate commission value based on new tier: basic = ~$1.00, gold = ~$2.50, merchant = ~$5.00
                let commissionValue = 0.00;
                if (tier === "basic") commissionValue = 1.00;
                else if (tier === "gold") commissionValue = 2.50;
                else if (tier === "merchant") commissionValue = 5.00;

                if (commissionValue > 0) {
                  // c. Non-blocking: call dispatchReward
                  setImmediate(() => {
                    dispatchReward({
                      type: "referral_subscription",
                      userId: referrer.id,
                      referenceId: userId,
                      amount: commissionValue,
                    }).catch((err) => {
                      logger.error("Failed to dispatch subscription reward", {
                        userId,
                        referrerId: referrer.id,
                        error: err instanceof Error ? err.message : String(err),
                      });
                    });
                  });

                  // d. Non-blocking: if referrer.trackdeskAffiliateId: call trackdeskService.logConversion
                  if (referrer.trackdeskAffiliateId) {
                    setImmediate(() => {
                      const trackdeskService = new TrackdeskService();
                      trackdeskService
                        .logConversion(
                          referrer.trackdeskAffiliateId!,
                          "referral_subscription",
                          userId,
                          commissionValue
                        )
                        .catch((err) => {
                          logger.error("Failed to log subscription conversion to Trackdesk", {
                            userId,
                            referrerId: referrer.id,
                            error: err instanceof Error ? err.message : String(err),
                          });
                        });
                    });
                  }
                }
              }
            }
          } catch (err) {
            logger.error("Error processing referral conversion for subscription", {
              userId,
              error: err instanceof Error ? err.message : String(err),
            });
          }

          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object as any;
          const stripeSubscriptionId = subscription.id as string | undefined;
          const priceId = subscription.items?.data?.[0]?.price?.id as string | undefined;
          const tier = mapPriceIdToTier(priceId);

          if (!stripeSubscriptionId) {
            logger.warn("customer.subscription.updated missing subscription id", {
              eventId: event.id,
            });
            break;
          }

          await db
            .update(user)
            .set({ tier })
            .where(eq(user.stripeSubscriptionId, stripeSubscriptionId));

          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object as any;
          const stripeSubscriptionId = subscription.id as string | undefined;

          if (!stripeSubscriptionId) {
            logger.warn("customer.subscription.deleted missing subscription id", {
              eventId: event.id,
            });
            break;
          }

          await db
            .update(user)
            .set({ tier: "free", stripeSubscriptionId: null })
            .where(eq(user.stripeSubscriptionId, stripeSubscriptionId));

          break;
        }

        case "invoice.payment_failed": {
          const invoice = event.data.object as any;
          logger.warn("Stripe invoice payment failed", {
            eventId: event.id,
            invoiceId: invoice.id,
            stripeSubscriptionId: invoice.subscription,
            customerId: invoice.customer,
          });
          break;
        }

        default: {
          logger.debug("Unhandled Stripe webhook event", { eventId: event.id, type: event.type });
        }
      }
    } catch (error) {
      logger.error("Failed processing Stripe webhook event.", {
        eventId: event.id,
        type: event.type,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  })();
});

export { router as stripeWebhookRouter };
