import { pgTable, text, timestamp, index, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Deals (Metadata Mirror)
 * Mirrors deal data from Coupontools for local querying and caching
 */

export const deal = pgTable(
  "deal",
  {
    id: text("id").primaryKey(), // Coupontools coupon ID
    
    // Basic deal information
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"), // e.g., 'food', 'entertainment', 'retail', 'services'
    subcategory: text("subcategory"),
    
    // Deal type and value
    dealType: text("deal_type").notNull(), // 'percentage', 'fixed_amount', 'bogo', 'freebie'
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }), // Percentage or amount
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
    discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }),
    
    // Merchant information
    merchantName: text("merchant_name").notNull(),
    merchantId: text("merchant_id"), // External merchant ID
    merchantLogo: text("merchant_logo"),
    merchantWebsite: text("merchant_website"),
    
    // Location data
    locations: text("locations").array(), // Array of location IDs or addresses
    isOnline: boolean("is_online").default(false).notNull(),
    
    // Availability
    status: text("status").notNull().default('active'), // 'active', 'inactive', 'expired', 'draft'
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    
    // Limits and restrictions
    maxRedemptions: integer("max_redemptions"), // Total redemptions allowed (null = unlimited)
    maxRedemptionsPerUser: integer("max_redemptions_per_user").default(1),
    currentRedemptions: integer("current_redemptions").default(0).notNull(),
    
    // Tier restrictions
    requiredTiers: text("required_tiers").array(), // Array of tier IDs that can access this deal
    
    // Coupontools integration
    coupontoolsCouponId: text("coupontools_coupon_id").unique(),
    coupontoolsTemplateId: text("coupontools_template_id"),
    coupontoolsData: text("coupontools_data"), // JSON blob of full Coupontools data
    
    // Media
    images: text("images").array(), // Array of image URLs
    thumbnailUrl: text("thumbnail_url"),
    
    // SEO and display
    slug: text("slug").unique(),
    tags: text("tags").array(),
    featured: boolean("featured").default(false).notNull(),
    priority: integer("priority").default(0).notNull(), // For sorting
    
    // Terms and conditions
    termsAndConditions: text("terms_and_conditions"),
    
    // Metadata
    metadata: text("metadata"), // JSON for additional flexible data
    
    // Sync tracking
    lastSyncedAt: timestamp("last_synced_at"),
    syncStatus: text("sync_status").default('synced'), // 'synced', 'pending', 'error'
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("deal_status_idx").on(table.status),
    index("deal_category_idx").on(table.category),
    index("deal_merchantId_idx").on(table.merchantId),
    index("deal_coupontoolsCouponId_idx").on(table.coupontoolsCouponId),
    index("deal_featured_idx").on(table.featured),
    index("deal_endDate_idx").on(table.endDate),
  ],
);

// Deal analytics/stats (optional - for tracking performance)
export const dealStats = pgTable(
  "deal_stats",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    dealId: text("deal_id")
      .notNull()
      .references(() => deal.id, { onDelete: "cascade" }),
    
    // Engagement metrics
    views: integer("views").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    saves: integer("saves").default(0).notNull(), // Added to wallet
    redemptions: integer("redemptions").default(0).notNull(),
    
    // Conversion metrics
    conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
    
    // Date for time-series data
    date: timestamp("date").notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("deal_stats_dealId_idx").on(table.dealId),
    index("deal_stats_date_idx").on(table.date),
  ],
);

// Relations
export const dealRelations = relations(deal, ({ many }) => ({
  stats: many(dealStats),
}));

export const dealStatsRelations = relations(dealStats, ({ one }) => ({
  deal: one(deal, {
    fields: [dealStats.dealId],
    references: [deal.id],
  }),
}));

