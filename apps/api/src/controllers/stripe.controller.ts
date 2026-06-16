import { db, eq, user, adminSettings } from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { useStripeLogger } from "../logger";
import { requireSession } from "../lib/authorization";
import { PRICE_IDS, stripe } from "../services/stripe.service";

const logger = useStripeLogger();

const createCheckoutSchema = z.object({
  tier: z.enum([
    "basic", "gold", "merchant", // backward compatibility
    "regular", "premium", "organization", "small_vendor", "premium_vendor"
  ]),
  interval: z.enum(["monthly", "yearly"]).optional().default("monthly"),
  locations: z.number().int().min(1).optional(),
});

function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return appUrl;
}

async function getAdminSettings() {
  let [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "default")).limit(1);
  if (!settings) {
    try {
      [settings] = await db
        .insert(adminSettings)
        .values({ id: "default" })
        .returning();
    } catch (e) {
      // In case of unique violation/race condition
      [settings] = await db.select().from(adminSettings).where(eq(adminSettings.id, "default")).limit(1);
    }
  }
  return settings;
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
      message: "Invalid subscription tier or parameters.",
      details: parsed.error.flatten(),
    });
  }

  const tier = parsed.data.tier;
  const interval = parsed.data.interval ?? "monthly";
  const locations = parsed.data.locations;

  const [currentUser] = await db
    .select({
      id: user.id,
      email: user.email,
      setupFeeWaived: user.setupFeeWaived,
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

  const tierPrices = PRICE_IDS[tier as keyof typeof PRICE_IDS];
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
    const settings = await getAdminSettings();

    const lineItems: any[] = [
      {
        price: priceId,
        quantity: tier === "premium_vendor" ? (locations ?? 6) : 1,
      }
    ];

    // Add optional one-time activation/setup fees if not waived
    if (!currentUser.setupFeeWaived) {
      if (tier === "premium") {
        const fee = settings?.premiumActivationFee ? parseFloat(settings.premiumActivationFee) : 25.00;
        if (fee > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Premium Membership Activation Fee",
                description: "One-time activation fee for Premium Membership",
              },
              unit_amount: Math.round(fee * 100),
            },
            quantity: 1,
          });
        }
      } else if (tier === "small_vendor" || tier === "premium_vendor") {
        const fee = settings?.vendorSetupFee ? parseFloat(settings.vendorSetupFee) : 80.00;
        if (fee > 0) {
          lineItems.push({
            price_data: {
              currency: "usd",
              product_data: {
                name: "Vendor Program Setup Fee",
                description: "One-time setup fee for Vendor account",
              },
              unit_amount: Math.round(fee * 100),
            },
            quantity: 1,
          });
        }
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: currentUser.email,
      line_items: lineItems,
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
