import { pgTable, text, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { deal } from "./deals";
import { relations, sql } from "drizzle-orm";

/**
 * Wallet Items
 * Tracks deals saved to user wallets (like favorites/saved deals)
 */

export const walletItem = pgTable(
  "wallet_item",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),
    
    // Status
    status: text("status").notNull().default('active'), // 'active', 'used', 'expired', 'removed'
    
    // Tracking
    addedAt: timestamp("added_at").defaultNow().notNull(),
    usedAt: timestamp("used_at"), // When the deal was redeemed
    expiresAt: timestamp("expires_at"), // Can be different from deal expiry
    removedAt: timestamp("removed_at"),
    
    // Notifications
    notificationSent: boolean("notification_sent").default(false).notNull(),
    reminderSent: boolean("reminder_sent").default(false).notNull(),
    
    // Metadata
    notes: text("notes"), // User's personal notes about the deal
    metadata: text("metadata"), // JSON for additional data
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("wallet_item_userId_idx").on(table.userId),
    index("wallet_item_dealId_idx").on(table.dealId),
    index("wallet_item_status_idx").on(table.status),
    index("wallet_item_expiresAt_idx").on(table.expiresAt),
    // Composite index for user + deal (prevent duplicates)
    index("wallet_item_userId_dealId_idx").on(table.userId, table.dealId),
  ],
);

// Relations
export const walletItemRelations = relations(walletItem, ({ one }) => ({
  user: one(user, {
    fields: [walletItem.userId],
    references: [user.id],
  }),
  deal: one(deal, {
    fields: [walletItem.dealId],
    references: [deal.id],
  }),
}));

