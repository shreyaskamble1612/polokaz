import { pgTable, text, timestamp, index, integer } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { relations, sql } from "drizzle-orm";

export const referral = pgTable(
  "referral",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    expiresAt: timestamp("expires_at"),
    maxUses: integer("max_uses"),
    createdBy: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Trackdesk tracking URL (wraps the referral link)
    trackdeskUrl: text("trackdesk_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("referral_userId_idx").on(table.createdBy)],
);

export const referralUse = pgTable(
  "referral_use",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    referralId: text("referral_id")
      .notNull()
      .references(() => referral.id, { onDelete: "cascade" }),
    usedBy: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Trackdesk integration fields
    trackdeskClickId: text("trackdesk_click_id"), // Trackdesk click ID from URL parameter
    trackdeskConversionId: text("trackdesk_conversion_id"), // Trackdesk conversion ID after reporting
    trackdeskStatus: text("trackdesk_status"), // pending, approved, rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("referralUse_userId_idx").on(table.usedBy),
    index("referralUse_referralId_idx").on(table.referralId),
    index("referralUse_trackdeskConversionId_idx").on(
      table.trackdeskConversionId,
    ),
  ],
);

export const referralRelations = relations(referral, ({ many, one }) => ({
  user: one(user, {
    fields: [referral.createdBy],
    references: [user.id],
  }),
  referralUse: many(referralUse),
}));

export const referralUseRelations = relations(referralUse, ({ one }) => ({
  user: one(user, {
    fields: [referralUse.usedBy],
    references: [user.id],
  }),
  referral: one(referral, {
    fields: [referralUse.referralId],
    references: [referral.id],
  }),
}));
