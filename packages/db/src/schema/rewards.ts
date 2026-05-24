import { relations } from "drizzle-orm";
import { boolean, decimal, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const pointsLedgerReasonValues = [
  "deal_redemption",
  "referral_signup",
  "referral_redemption",
  "points_spent",
] as const;
export type PointsLedgerReason = (typeof pointsLedgerReasonValues)[number];

export const commissionStatusValues = ["pending", "approved", "paid", "rejected"] as const;
export type CommissionStatus = (typeof commissionStatusValues)[number];

export const commissionReasonValues = [
  "referral_signup",
  "referral_redemption",
  "referral_subscription",
] as const;
export type CommissionReason = (typeof commissionReasonValues)[number];

export const pointsLedger = pgTable("points_ledger", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  reason: text("reason").$type<PointsLedgerReason>().notNull(),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commissions = pgTable("commissions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status").$type<CommissionStatus>().default("pending").notNull(),
  reason: text("reason").$type<CommissionReason>().notNull(),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  paidAt: timestamp("paid_at"),
});

export const pointsLedgerRelations = relations(pointsLedger, ({ one }) => ({
  user: one(user, {
    fields: [pointsLedger.userId],
    references: [user.id],
  }),
}));

export const commissionsRelations = relations(commissions, ({ one }) => ({
  user: one(user, {
    fields: [commissions.userId],
    references: [user.id],
  }),
}));
