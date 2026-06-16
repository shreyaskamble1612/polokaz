import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  adminId: text("admin_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  adminRole: text("admin_role").notNull(), // admin | super_admin
  targetUserId: text("target_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // suspend | reinstate | cancel | terminate | waive_fee | grant_reward | tier_change | commission_override | donation_approve | promo_enable
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  reason: text("reason").notNull(),
  notes: text("notes"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blockedEmails = pgTable("blocked_emails", {
  email: text("email").primaryKey().notNull(),
  blockedAt: timestamp("blocked_at").defaultNow().notNull(),
});
