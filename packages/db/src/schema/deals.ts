import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Deals cached from Coupontools for fast local browsing.
 *
 * The required sync fields mirror the PRD:
 * - internal UUID id
 * - unique Coupontools ID
 * - category / deal type / status
 * - expiry / redemption payload / sync timestamp
 *
 * We also keep a few display fields already used by the web app so the new
 * sync flow stays compatible with the current browse UI.
 */

export const deal = pgTable(
  "deal",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),

    coupontoolsId: text("coupontools_id").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),

    // No merchant table exists in the repo yet, so this remains nullable text.
    merchantId: text("merchant_id"),
    merchantName: text("merchant_name").notNull(),

    category: text("category"),
    dealType: text("deal_type").notNull(),
    status: text("status").notNull().default("active"),

    expiresAt: timestamp("expires_at"),
    redemptionData: jsonb("redemption_data").$type<Record<string, unknown> | null>(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),

    // Compatibility/display fields already consumed by the app.
    coupontoolsCouponId: text("coupontools_coupon_id"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    discountValue: decimal("discount_value", { precision: 10, scale: 2 }),
    merchantLogo: text("merchant_logo"),
    merchantWebsite: text("merchant_website"),
    images: text("images").array(),
    thumbnailUrl: text("thumbnail_url"),
    featured: boolean("featured").default(false).notNull(),
    priority: integer("priority").default(0).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    coupontoolsData: jsonb("coupontools_data").$type<Record<string, unknown> | null>(),

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
    index("deal_coupontoolsId_idx").on(table.coupontoolsId),
    index("deal_featured_idx").on(table.featured),
    index("deal_expiresAt_idx").on(table.expiresAt),
  ],
);

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
    views: integer("views").default(0).notNull(),
    clicks: integer("clicks").default(0).notNull(),
    saves: integer("saves").default(0).notNull(),
    redemptions: integer("redemptions").default(0).notNull(),
    conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
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

export const dealRelations = relations(deal, ({ many }) => ({
  stats: many(dealStats),
}));

export const dealStatsRelations = relations(dealStats, ({ one }) => ({
  deal: one(deal, {
    fields: [dealStats.dealId],
    references: [deal.id],
  }),
}));
