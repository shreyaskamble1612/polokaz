import { db, eq, user } from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { useStripeLogger } from "../logger";
import { requireSession } from "../lib/authorization";
import { PRICE_IDS, stripe } from "../services/stripe.service";

const logger = useStripeLogger();

const createCheckoutSchema = z.object({
  tier: z.enum(["basic", "gold", "merchant"]),
  interval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return appUrl;
}

export async function createCheckoutSession(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) {
    return;
  }

  const parsed = createCheckoutSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "Tier must be one of: basic, gold, merchant. Interval must be monthly or yearly.",
      details: parsed.error.flatten(),
    });
  }

  const tier = parsed.data.tier;
  const interval = parsed.data.interval ?? "monthly";

  const [currentUser] = await db
    .select({
      id: user.id,
      email: user.email,
    })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!currentUser) {
    return res.status(404).json({
      error: "USER_NOT_FOUND",
      message: "Authenticated user was not found.",
    });
  }

  const tierPrices = PRICE_IDS[tier];
  const priceId = interval === "yearly" ? (tierPrices.yearly || tierPrices.monthly) : tierPrices.monthly;

  if (!priceId) {
    logger.error("Missing Stripe price ID for checkout tier.", { tier, interval });
    return res.status(500).json({
      error: "STRIPE_PRICE_NOT_CONFIGURED",
      message: `Stripe price ID is missing for tier "${tier}" (${interval}).`,
    });
  }

  try {
    const appUrl = getAppUrl();
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: currentUser.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/plans?checkout=success`,
      cancel_url: `${appUrl}/plans`,
      metadata: { userId: currentUser.id, tier, interval },
    });

    if (!checkoutSession.url) {
      return res.status(500).json({
        error: "STRIPE_URL_MISSING",
        message: "Stripe did not return a checkout URL.",
      });
    }

    return res.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Failed to create Stripe checkout session.", {
      userId: currentUser.id,
      tier,
      error: error instanceof Error ? error.message : String(error),
    });

    return res.status(500).json({
      error: "STRIPE_CHECKOUT_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Failed to create Stripe checkout session.",
    });
  }
}
