import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const referralClicks = pgTable("referral_clicks", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  referralCode: text("referral_code").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
  ipAddressHash: text("ip_address_hash"),
  converted: boolean("converted").default(false).notNull(),
});

export const referralConversions = pgTable("referral_conversions", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  referrerId: text("referrer_id").references(() => user.id, { onDelete: "set null" }),
  referredUserId: text("referred_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  signedUpAt: timestamp("signed_up_at").defaultNow().notNull(),
  rewardGranted: boolean("reward_granted").default(false).notNull(),
});

export const referralConversionsRelations = relations(referralConversions, ({ one }) => ({
  referrer: one(user, {
    fields: [referralConversions.referrerId],
    references: [user.id],
  }),
  referredUser: one(user, {
    fields: [referralConversions.referredUserId],
    references: [user.id],
  }),
}));
