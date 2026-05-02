import Stripe from "stripe";
import type { MembershipTier } from "@polokaz/db";

export type CheckoutTier = Exclude<MembershipTier, "free">;

const checkoutTierValues: CheckoutTier[] = ["basic", "gold", "merchant"];

const stripePriceIds = {
  basic: process.env.STRIPE_PRICE_BASIC_MONTHLY,
  gold: process.env.STRIPE_PRICE_GOLD_MONTHLY,
  merchant: process.env.STRIPE_PRICE_MERCHANT_MONTHLY,
} satisfies Record<CheckoutTier, string | undefined>;

function createStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

let stripeClient: ReturnType<typeof createStripeClient> | null = null;

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  stripeClient ??= createStripeClient();

  return stripeClient;
}

function getFrontendBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
  }

  return baseUrl.replace(/\/$/, "");
}

function getCheckoutPriceId(tier: CheckoutTier) {
  const priceId = stripePriceIds[tier];

  if (!priceId) {
    throw new Error(`Stripe price ID is missing for tier "${tier}".`);
  }

  return priceId;
}

export function isCheckoutTier(value: string): value is CheckoutTier {
  return checkoutTierValues.includes(value as CheckoutTier);
}

export async function createCheckoutSession(input: {
  tier: CheckoutTier;
  user: {
    id: string;
    email: string;
    stripeCustomerId: string | null;
  };
}) {
  const stripe = getStripeClient();
  const baseUrl = getFrontendBaseUrl();
  const priceId = getCheckoutPriceId(input.tier);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: input.user.id,
    customer: input.user.stripeCustomerId ?? undefined,
    customer_email: input.user.stripeCustomerId ? undefined : input.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url:
      process.env.STRIPE_CHECKOUT_SUCCESS_URL ??
      `${baseUrl}/dashboard?checkout=success`,
    cancel_url:
      process.env.STRIPE_CHECKOUT_CANCEL_URL ?? `${baseUrl}/pricing`,
    metadata: {
      userId: input.user.id,
      tier: input.tier,
    },
    subscription_data: {
      metadata: {
        userId: input.user.id,
        tier: input.tier,
      },
    },
  });
}
