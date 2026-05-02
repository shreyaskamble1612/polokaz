import express from "express";
import { db, eq, user } from "@polokaz/db";
import { z } from "zod";
import { createCheckoutSession, isCheckoutTier } from "../services/stripe";
import { useStripeLogger } from "../logger";
import Stripe from "stripe";
import {
  createWebhookEvent,
  isWebhookProcessed,
  updateWebhookEventStatus,
  logWebhookStep,
} from "../services/webhooks";

const router = express.Router();
const logger = useStripeLogger();

const createCheckoutSchema = z.object({
  tier: z.string().trim().min(1),
});

router.post("/create-checkout", async (req, res) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "You must be signed in to create a checkout session.",
    });
  }

  const parsed = createCheckoutSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_PAYLOAD",
      message: "A valid tier is required.",
      details: parsed.error.flatten(),
    });
  }

  const requestedTier = parsed.data.tier.toLowerCase();

  if (requestedTier === "free") {
    return res.status(400).json({
      error: "FREE_TIER_NO_CHECKOUT",
      message: "Free tier does not require Stripe checkout.",
    });
  }

  if (!isCheckoutTier(requestedTier)) {
    return res.status(400).json({
      error: "INVALID_TIER",
      message: "Tier must be one of: basic, gold, merchant.",
    });
  }

  const [foundUser] = await db
    .select({
      id: user.id,
      email: user.email,
      tier: user.tier,
      stripeCustomerId: user.stripeCustomerId,
    })
    .from(user)
    .where(eq(user.id, req.session.user.id))
    .limit(1);

  if (!foundUser) {
    return res.status(404).json({
      error: "USER_NOT_FOUND",
      message: "Authenticated user was not found.",
    });
  }

  try {
    const session = await createCheckoutSession({
      tier: requestedTier,
      user: foundUser,
    });

    if (!session.url) {
      logger.error("Stripe checkout session was created without a redirect URL.", {
        userId: foundUser.id,
        tier: requestedTier,
        sessionId: session.id,
      });

      return res.status(500).json({
        error: "STRIPE_URL_MISSING",
        message: "Stripe did not return a checkout URL.",
      });
    }

    return res.json({ url: session.url });
  } catch (error) {
    logger.error("Failed to create Stripe checkout session.", {
      userId: foundUser.id,
      tier: requestedTier,
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
});

export { router as stripeRouter };

