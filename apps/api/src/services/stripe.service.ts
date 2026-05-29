import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20" as any,
});

export const PRICE_IDS = {
  basic: {
    monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || process.env.STRIPE_PRICE_BASIC,
    yearly: process.env.STRIPE_PRICE_BASIC_YEARLY,
  },
  gold: {
    monthly: process.env.STRIPE_PRICE_GOLD_MONTHLY || process.env.STRIPE_PRICE_GOLD,
    yearly: process.env.STRIPE_PRICE_GOLD_YEARLY,
  },
  merchant: {
    monthly: process.env.STRIPE_PRICE_MERCHANT_MONTHLY || process.env.STRIPE_PRICE_MERCHANT,
    yearly: process.env.STRIPE_PRICE_MERCHANT_YEARLY,
  },
} as const;

export type StripeCheckoutTier = keyof typeof PRICE_IDS;
