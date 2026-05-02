import { db, subscriptionTier } from "@polokaz/db";
import "dotenv/config";

/**
 * Seed subscription tiers
 * Run with: pnpm tsx scripts/seed-tiers.ts
 */

const tiers = [
  {
    id: "free",
    name: "Free",
    description: "No-cost entry tier for browsing and basic account access",
    monthlyPrice: "0.00",
    yearlyPrice: "0.00",
    stripePriceIdMonthly: null,
    stripePriceIdYearly: null,
    features: [
      "Free account creation",
      "Access to free deals",
      "Entry-level rewards access",
      "Upgrade anytime",
    ],
    maxDealsPerMonth: 5,
    maxWalletItems: 10,
    priority: 0,
    active: true,
  },
  {
    id: "basic",
    name: "Basic",
    description: "Consumer paid tier with broader deal access and savings",
    monthlyPrice: "9.99",
    yearlyPrice: "99.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || null,
    stripePriceIdYearly: null,
    features: [
      "Access to member deals",
      "Priority deal visibility",
      "Up to 25 wallet items",
      "15 redemptions per month",
      "Referral rewards",
      "Email support",
    ],
    maxDealsPerMonth: 15,
    maxWalletItems: 25,
    priority: 1,
    active: true,
  },
  {
    id: "gold",
    name: "Gold",
    description: "Premium consumer experience with the top reward benefits",
    monthlyPrice: "29.99",
    yearlyPrice: "299.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_GOLD_MONTHLY || null,
    stripePriceIdYearly: null,
    features: [
      "Access to all deals",
      "Unlimited wallet items",
      "Unlimited redemptions",
      "Priority support",
      "Exclusive VIP deals",
      "Higher referral rewards",
      "Bonus member perks",
    ],
    maxDealsPerMonth: null, // unlimited
    maxWalletItems: null, // unlimited
    priority: 2,
    active: true,
  },
  {
    id: "merchant",
    name: "Merchant Plan",
    description: "Business onboarding tier for merchants creating deals",
    monthlyPrice: "99.99",
    yearlyPrice: "999.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_MERCHANT_MONTHLY || null,
    stripePriceIdYearly: null,
    features: [
      "Merchant portal access",
      "Deal creation tools",
      "Voucher campaign management",
      "Coupon analytics",
      "Priority merchant support",
      "Business onboarding",
    ],
    maxDealsPerMonth: null, // unlimited
    maxWalletItems: null, // unlimited
    priority: 3,
    active: true,
  },
];

async function seedTiers() {
  console.log("🌱 Seeding subscription tiers...");

  try {
    for (const tier of tiers) {
      const existing = await db
        .select()
        .from(subscriptionTier)
        .where((t) => t.id === tier.id)
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Tier "${tier.name}" already exists, skipping...`);
        continue;
      }

      await db.insert(subscriptionTier).values(tier);
      console.log(`✅ Created tier: ${tier.name} ($${tier.monthlyPrice}/mo)`);
    }

    console.log("\n🎉 Subscription tiers seeded successfully!");
    console.log("\nNext steps:");
    console.log("1. Set up Stripe products and prices");
    console.log("2. Update .env with Stripe price IDs");
    console.log("3. Re-run this script to update tier records");
  } catch (error) {
    console.error("❌ Error seeding tiers:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedTiers();
