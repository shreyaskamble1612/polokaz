import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { merchants } from "./merchants";
import { user } from "./auth";

export const dealTypeValues = ["coupon", "voucher", "loyalty"] as const;
export type DealType = (typeof dealTypeValues)[number];

export const dealStatusValues = [
  "active",
  "inactive",
  "pending_moderation",
  "rejected",
] as const;
export type DealStatus = (typeof dealStatusValues)[number];

export const walletItemStatusValues = ["saved", "redeemed"] as const;
export type WalletItemStatus = (typeof walletItemStatusValues)[number];

export const deals = pgTable(
  "deals",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    coupontoolsId: text("coupontools_id").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),
    merchantId: uuid("merchant_id").references(() => merchants.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    dealType: text("deal_type").$type<DealType>().notNull(),
    status: text("status").$type<DealStatus>().default("pending_moderation").notNull(),
    expiresAt: timestamp("expires_at"),
    redemptionData: jsonb("redemption_data").$type<Record<string, unknown> | null>(),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Legacy fields kept so existing browse/admin flows can continue to compile.
    merchantName: text("merchant_name"),
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
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("deals_category_status_idx").on(table.category, table.status),
    index("deals_merchant_id_idx").on(table.merchantId),
    index("deals_coupontools_id_idx").on(table.coupontoolsId),
    index("deals_featured_idx").on(table.featured),
    index("deals_expires_at_idx").on(table.expiresAt),
  ],
);

export const walletItems = pgTable(
  "wallet_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    status: text("status").$type<WalletItemStatus>().default("saved").notNull(),
    savedAt: timestamp("saved_at").defaultNow().notNull(),
    redeemedAt: timestamp("redeemed_at"),
  },
  (table) => [
    index("wallet_items_user_id_idx").on(table.userId),
    index("wallet_items_deal_id_idx").on(table.dealId),
    uniqueIndex("wallet_items_user_id_deal_id_unique").on(table.userId, table.dealId),
  ],
);

export const redemptions = pgTable(
  "redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    dealId: uuid("deal_id")
      .notNull()
      .references(() => deals.id, { onDelete: "cascade" }),
    merchantId: uuid("merchant_id")
      .notNull()
      .references(() => merchants.id, { onDelete: "cascade" }),
    coupontoolsEventId: text("coupontools_event_id").unique(),
    redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
    rewardDispatched: boolean("reward_dispatched").default(false).notNull(),
  },
  (table) => [
    index("redemptions_user_id_idx").on(table.userId),
    index("redemptions_deal_id_idx").on(table.dealId),
    index("redemptions_merchant_id_idx").on(table.merchantId),
  ],
);

export const dealsRelations = relations(deals, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [deals.merchantId],
    references: [merchants.id],
  }),
  walletItems: many(walletItems),
  redemptions: many(redemptions),
}));

export const walletItemsRelations = relations(walletItems, ({ one }) => ({
  user: one(user, {
    fields: [walletItems.userId],
    references: [user.id],
  }),
  deal: one(deals, {
    fields: [walletItems.dealId],
    references: [deals.id],
  }),
}));

export const redemptionsRelations = relations(redemptions, ({ one }) => ({
  user: one(user, {
    fields: [redemptions.userId],
    references: [user.id],
  }),
  deal: one(deals, {
    fields: [redemptions.dealId],
    references: [deals.id],
  }),
  merchant: one(merchants, {
    fields: [redemptions.merchantId],
    references: [merchants.id],
  }),
}));

// Backwards-compatible aliases for the current application imports.
export const deal = deals;
export const walletItem = walletItems;
export const redemption = redemptions;
