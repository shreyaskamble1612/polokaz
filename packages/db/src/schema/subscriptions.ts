import { pgTable, text, timestamp, index, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations, sql } from "drizzle-orm";

/**
 * User Tiers / Subscriptions
 * Manages subscription tiers and user subscription status
 */

// Subscription tier definitions (Bronze, Silver, Gold, Platinum)
export const subscriptionTier = pgTable("subscription_tier", {
  id: text("id").primaryKey(), // e.g., 'bronze', 'silver', 'gold', 'platinum'
  name: text("name").notNull(), // Display name
  description: text("description"),
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal("yearly_price", { precision: 10, scale: 2 }).notNull(),
  stripePriceIdMonthly: text("stripe_price_id_monthly"), // Stripe Price ID for monthly
  stripePriceIdYearly: text("stripe_price_id_yearly"), // Stripe Price ID for yearly
  features: text("features").array(), // JSON array of features
  maxDealsPerMonth: integer("max_deals_per_month"), // null = unlimited
  maxWalletItems: integer("max_wallet_items"), // null = unlimited
  priority: integer("priority").notNull().default(0), // For ordering tiers
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// User subscriptions (links users to their subscription tier)
export const userSubscription = pgTable(
  "user_subscription",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tierId: text("tier_id")
      .notNull()
      .references(() => subscriptionTier.id),
    status: text("status").notNull(), // 'active', 'canceled', 'past_due', 'trialing', 'paused'
    billingCycle: text("billing_cycle").notNull(), // 'monthly', 'yearly'
    
    // Stripe integration
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripePriceId: text("stripe_price_id"),
    
    // Subscription dates
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAt: timestamp("cancel_at"), // Scheduled cancellation
    canceledAt: timestamp("canceled_at"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    
    // Metadata
    metadata: text("metadata"), // JSON for additional data
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_subscription_userId_idx").on(table.userId),
    index("user_subscription_tierId_idx").on(table.tierId),
    index("user_subscription_stripeCustomerId_idx").on(table.stripeCustomerId),
    index("user_subscription_stripeSubscriptionId_idx").on(table.stripeSubscriptionId),
    index("user_subscription_status_idx").on(table.status),
  ],
);

// Subscription history for audit trail
export const subscriptionHistory = pgTable(
  "subscription_history",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => userSubscription.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // 'created', 'upgraded', 'downgraded', 'canceled', 'renewed', 'paused', 'resumed'
    fromTierId: text("from_tier_id").references(() => subscriptionTier.id),
    toTierId: text("to_tier_id").references(() => subscriptionTier.id),
    reason: text("reason"), // Optional reason for change
    metadata: text("metadata"), // JSON for additional context
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("subscription_history_userId_idx").on(table.userId),
    index("subscription_history_subscriptionId_idx").on(table.subscriptionId),
  ],
);

// Relations
export const subscriptionTierRelations = relations(subscriptionTier, ({ many }) => ({
  userSubscriptions: many(userSubscription),
}));

export const userSubscriptionRelations = relations(userSubscription, ({ one, many }) => ({
  user: one(user, {
    fields: [userSubscription.userId],
    references: [user.id],
  }),
  tier: one(subscriptionTier, {
    fields: [userSubscription.tierId],
    references: [subscriptionTier.id],
  }),
  history: many(subscriptionHistory),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  user: one(user, {
    fields: [subscriptionHistory.userId],
    references: [user.id],
  }),
  subscription: one(userSubscription, {
    fields: [subscriptionHistory.subscriptionId],
    references: [userSubscription.id],
  }),
  fromTier: one(subscriptionTier, {
    fields: [subscriptionHistory.fromTierId],
    references: [subscriptionTier.id],
  }),
  toTier: one(subscriptionTier, {
    fields: [subscriptionHistory.toTierId],
    references: [subscriptionTier.id],
  }),
}));

