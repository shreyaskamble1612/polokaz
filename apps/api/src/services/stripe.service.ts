import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20" as any,
});

export const PRICE_IDS = {
  regular: {
    monthly: process.env.STRIPE_PRICE_REGULAR_MONTHLY,
    yearly: process.env.STRIPE_PRICE_REGULAR_YEARLY,
  },
  premium: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
  },
  organization: {
    monthly: process.env.STRIPE_PRICE_ORGANIZATION_MONTHLY,
    yearly: process.env.STRIPE_PRICE_ORGANIZATION_YEARLY,
  },
  small_vendor: {
    monthly: process.env.STRIPE_PRICE_SMALL_VENDOR_MONTHLY,
    yearly: process.env.STRIPE_PRICE_SMALL_VENDOR_YEARLY,
  },
  premium_vendor: {
    monthly: process.env.STRIPE_PRICE_PREMIUM_VENDOR_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PREMIUM_VENDOR_YEARLY,
  },
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
