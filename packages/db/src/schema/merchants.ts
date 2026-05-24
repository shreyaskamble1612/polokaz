import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { deals, redemptions } from "./deals";

export const merchantStatusValues = ["pending", "active", "suspended"] as const;
export type MerchantStatus = (typeof merchantStatusValues)[number];

export const merchants = pgTable(
  "merchants",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    businessName: text("business_name").notNull(),
    businessCategory: text("business_category"),
    contactEmail: text("contact_email").notNull(),
    website: text("website"),
    coupontoolsMerchantId: text("coupontools_merchant_id"),
    status: text("status").$type<MerchantStatus>().default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("merchants_user_id_unique").on(table.userId)],
);

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(user, {
    fields: [merchants.userId],
    references: [user.id],
  }),
  deals: many(deals),
  redemptions: many(redemptions),
}));
