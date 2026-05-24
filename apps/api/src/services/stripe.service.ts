import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2024-06-20" as Stripe.LatestApiVersion,
});

export const PRICE_IDS = {
  basic: process.env.STRIPE_PRICE_BASIC,
  gold: process.env.STRIPE_PRICE_GOLD,
  merchant: process.env.STRIPE_PRICE_MERCHANT,
} as const;

export type StripeCheckoutTier = keyof typeof PRICE_IDS;
