import { pgTable, text, timestamp, index, integer, decimal } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { referral } from "./referral";
import { redemption } from "./redemptions";
import { relations, sql } from "drizzle-orm";

/**
 * Rewards Ledger
 * Tracks all reward transactions (points, credits, bonuses)
 */

export const rewardsLedger = pgTable(
  "rewards_ledger",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Transaction details
    transactionType: text("transaction_type").notNull(), // 'earn', 'spend', 'refund', 'adjustment', 'bonus', 'expiry'
    category: text("category").notNull(), // 'referral', 'redemption', 'signup_bonus', 'subscription', 'manual', 'promotion'
    
    // Amount
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(), // Positive for earn, negative for spend
    pointsAmount: integer("points_amount"), // If using points system
    
    // Balance tracking
    balanceBefore: decimal("balance_before", { precision: 10, scale: 2 }).notNull(),
    balanceAfter: decimal("balance_after", { precision: 10, scale: 2 }).notNull(),
    
    // Source tracking
    sourceType: text("source_type"), // 'referral', 'redemption', 'subscription', 'manual'
    sourceId: text("source_id"), // ID of the source (referral ID, redemption ID, etc.)
    
    // Related entities
    referralId: text("referral_id").references(() => referral.id, { onDelete: "set null" }),
    redemptionId: text("redemption_id").references(() => redemption.id, { onDelete: "set null" }),
    
    // Trackdesk integration (for affiliate commissions)
    trackdeskConversionId: text("trackdesk_conversion_id"),
    trackdeskCommission: decimal("trackdesk_commission", { precision: 10, scale: 2 }),
    
    // Description and metadata
    description: text("description").notNull(),
    metadata: text("metadata"), // JSON for additional context
    
    // Expiry (for points that expire)
    expiresAt: timestamp("expires_at"),
    
    // Admin tracking
    createdBy: text("created_by"), // Admin user ID if manual adjustment
    notes: text("notes"), // Admin notes
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("rewards_ledger_userId_idx").on(table.userId),
    index("rewards_ledger_transactionType_idx").on(table.transactionType),
    index("rewards_ledger_category_idx").on(table.category),
    index("rewards_ledger_createdAt_idx").on(table.createdAt),
    index("rewards_ledger_referralId_idx").on(table.referralId),
    index("rewards_ledger_redemptionId_idx").on(table.redemptionId),
    index("rewards_ledger_trackdeskConversionId_idx").on(table.trackdeskConversionId),
  ],
);

// User rewards balance (aggregated view)
export const userRewardsBalance = pgTable(
  "user_rewards_balance",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    
    // Current balances
    cashBalance: decimal("cash_balance", { precision: 10, scale: 2 }).default('0').notNull(),
    pointsBalance: integer("points_balance").default(0).notNull(),
    
    // Lifetime stats
    lifetimeEarned: decimal("lifetime_earned", { precision: 10, scale: 2 }).default('0').notNull(),
    lifetimeSpent: decimal("lifetime_spent", { precision: 10, scale: 2 }).default('0').notNull(),
    lifetimePoints: integer("lifetime_points").default(0).notNull(),
    
    // Pending rewards (not yet confirmed)
    pendingCash: decimal("pending_cash", { precision: 10, scale: 2 }).default('0').notNull(),
    pendingPoints: integer("pending_points").default(0).notNull(),
    
    // Last transaction
    lastTransactionAt: timestamp("last_transaction_at"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_rewards_balance_userId_idx").on(table.userId),
  ],
);

// Relations
export const rewardsLedgerRelations = relations(rewardsLedger, ({ one }) => ({
  user: one(user, {
    fields: [rewardsLedger.userId],
    references: [user.id],
  }),
  referral: one(referral, {
    fields: [rewardsLedger.referralId],
    references: [referral.id],
  }),
  redemption: one(redemption, {
    fields: [rewardsLedger.redemptionId],
    references: [redemption.id],
  }),
}));

export const userRewardsBalanceRelations = relations(userRewardsBalance, ({ one }) => ({
  user: one(user, {
    fields: [userRewardsBalance.userId],
    references: [user.id],
  }),
}));

