import { pgTable, text, timestamp, index, decimal, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { deal } from "./deals";
import { walletItem } from "./wallet";
import { relations, sql } from "drizzle-orm";

/**
 * Redemptions
 * Tracks when users redeem deals (integrates with Coupontools)
 */

export const redemption = pgTable(
  "redemption",
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
    walletItemId: text("wallet_item_id").references(() => walletItem.id, { onDelete: "set null" }),
    
    // Redemption details
    status: text("status").notNull().default('pending'), // 'pending', 'completed', 'failed', 'refunded', 'canceled'
    redemptionCode: text("redemption_code").unique(), // Unique code for this redemption
    
    // Location and method
    redemptionMethod: text("redemption_method").notNull(), // 'in_store', 'online', 'qr_code', 'barcode'
    locationId: text("location_id"), // Where it was redeemed
    locationName: text("location_name"),
    
    // Financial tracking
    dealValue: decimal("deal_value", { precision: 10, scale: 2 }), // Value of discount
    transactionAmount: decimal("transaction_amount", { precision: 10, scale: 2 }), // Total transaction
    
    // Coupontools integration
    coupontoolsRedemptionId: text("coupontools_redemption_id").unique(),
    coupontoolsValidationId: text("coupontools_validation_id"),
    coupontoolsData: text("coupontools_data"), // JSON blob of Coupontools response
    
    // Trackdesk affiliate tracking
    trackdeskClickId: text("trackdesk_click_id"), // For attribution
    trackdeskConversionId: text("trackdesk_conversion_id"),
    trackdeskCommission: decimal("trackdesk_commission", { precision: 10, scale: 2 }),
    
    // Timestamps
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
    validatedAt: timestamp("validated_at"), // When merchant validated
    completedAt: timestamp("completed_at"), // When fully processed
    refundedAt: timestamp("refunded_at"),
    
    // Verification
    verified: boolean("verified").default(false).notNull(),
    verifiedBy: text("verified_by"), // Staff/merchant ID who verified
    
    // Device and context
    deviceType: text("device_type"), // 'mobile', 'tablet', 'desktop'
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    
    // Notes and metadata
    notes: text("notes"),
    metadata: text("metadata"), // JSON for additional data
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("redemption_userId_idx").on(table.userId),
    index("redemption_dealId_idx").on(table.dealId),
    index("redemption_status_idx").on(table.status),
    index("redemption_redeemedAt_idx").on(table.redeemedAt),
    index("redemption_coupontoolsRedemptionId_idx").on(table.coupontoolsRedemptionId),
    index("redemption_trackdeskClickId_idx").on(table.trackdeskClickId),
    index("redemption_redemptionCode_idx").on(table.redemptionCode),
  ],
);

// Relations
export const redemptionRelations = relations(redemption, ({ one }) => ({
  user: one(user, {
    fields: [redemption.userId],
    references: [user.id],
  }),
  deal: one(deal, {
    fields: [redemption.dealId],
    references: [deal.id],
  }),
  walletItem: one(walletItem, {
    fields: [redemption.walletItemId],
    references: [walletItem.id],
  }),
}));

