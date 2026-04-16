import { db, subscriptionTier } from "@polokaz/db";
import "dotenv/config";

/**
 * Seed subscription tiers
 * Run with: pnpm tsx scripts/seed-tiers.ts
 */

const tiers = [
  {
    id: "bronze",
    name: "Bronze",
    description: "Essential deals and discounts for everyday savings",
    monthlyPrice: "9.99",
    yearlyPrice: "99.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BRONZE_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_BRONZE_YEARLY || null,
    features: [
      "Access to basic deals",
      "Up to 10 wallet items",
      "5 redemptions per month",
      "Email support",
    ],
    maxDealsPerMonth: 5,
    maxWalletItems: 10,
    priority: 1,
    active: true,
  },
  {
    id: "silver",
    name: "Silver",
    description: "Enhanced benefits with more deals and exclusive offers",
    monthlyPrice: "19.99",
    yearlyPrice: "199.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_SILVER_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_SILVER_YEARLY || null,
    features: [
      "Access to all basic deals",
      "Access to premium deals",
      "Up to 25 wallet items",
      "15 redemptions per month",
      "Priority email support",
      "Early access to new deals",
    ],
    maxDealsPerMonth: 15,
    maxWalletItems: 25,
    priority: 2,
    active: true,
  },
  {
    id: "gold",
    name: "Gold",
    description: "Premium experience with unlimited access and rewards",
    monthlyPrice: "39.99",
    yearlyPrice: "399.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_GOLD_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_GOLD_YEARLY || null,
    features: [
      "Access to all deals",
      "Unlimited wallet items",
      "Unlimited redemptions",
      "Priority support",
      "Exclusive VIP deals",
      "2x referral rewards",
      "Monthly bonus credits",
    ],
    maxDealsPerMonth: null, // unlimited
    maxWalletItems: null, // unlimited
    priority: 3,
    active: true,
  },
  {
    id: "platinum",
    name: "Platinum",
    description: "Ultimate luxury with concierge service and maximum benefits",
    monthlyPrice: "99.99",
    yearlyPrice: "999.99",
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PLATINUM_MONTHLY || null,
    stripePriceIdYearly: process.env.STRIPE_PRICE_PLATINUM_YEARLY || null,
    features: [
      "Everything in Gold",
      "Dedicated concierge service",
      "Custom deal requests",
      "3x referral rewards",
      "Exclusive platinum-only events",
      "Partner perks and benefits",
      "Quarterly bonus credits",
    ],
    maxDealsPerMonth: null, // unlimited
    maxWalletItems: null, // unlimited
    priority: 4,
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

