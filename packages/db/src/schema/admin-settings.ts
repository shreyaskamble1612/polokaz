import { pgTable, text, timestamp, integer, decimal, jsonb } from "drizzle-orm/pg-core";

export const adminSettings = pgTable("admin_settings", {
  id: text("id").primaryKey(), // Usually "default"
  referralQualificationLimit: integer("referral_qualification_limit").default(5).notNull(),
  premiumActivationFee: decimal("premium_activation_fee", { precision: 10, scale: 2 })
    .default("25.00")
    .notNull(),
  vendorSetupFee: decimal("vendor_setup_fee", { precision: 10, scale: 2 })
    .default("80.00")
    .notNull(),
  referralTiers: jsonb("referral_tiers")
    .$type<
      Array<{
        minReferrals: number;
        maxReferrals: number | null; // null represents infinity/unlimited (e.g. 5000+)
        commissionPercentage: number; // e.g. 50, 40, etc.
      }>
    >()
    .default([
      { minReferrals: 5, maxReferrals: 24, commissionPercentage: 50 },
      { minReferrals: 25, maxReferrals: 49, commissionPercentage: 40 },
      { minReferrals: 50, maxReferrals: 99, commissionPercentage: 35 },
      { minReferrals: 100, maxReferrals: 249, commissionPercentage: 30 },
      { minReferrals: 250, maxReferrals: 499, commissionPercentage: 25 },
      { minReferrals: 500, maxReferrals: 999, commissionPercentage: 20 },
      { minReferrals: 1000, maxReferrals: 2499, commissionPercentage: 15 },
      { minReferrals: 2500, maxReferrals: 4999, commissionPercentage: 10 },
      { minReferrals: 5000, maxReferrals: null, commissionPercentage: 5 },
    ])
    .notNull(),
  bonuses: jsonb("bonuses")
    .$type<
      Array<{
        milestone: number; // e.g. 100, 250, etc.
        bonusAmount: number; // reward amount
        rewardType: "cash" | "points";
      }>
    >()
    .default([
      { milestone: 100, bonusAmount: 100, rewardType: "cash" },
      { milestone: 250, bonusAmount: 250, rewardType: "cash" },
      { milestone: 500, bonusAmount: 500, rewardType: "cash" },
      { milestone: 1000, bonusAmount: 1000, rewardType: "cash" },
      { milestone: 2500, bonusAmount: 2500, rewardType: "cash" },
      { milestone: 5000, bonusAmount: 5000, rewardType: "cash" },
    ])
    .notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
