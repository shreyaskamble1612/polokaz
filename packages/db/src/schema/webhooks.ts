import { pgTable, text, timestamp, index, integer, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Webhook Events (Idempotency)
 * Tracks all incoming webhooks from Stripe, Coupontools, Trackdesk
 * Ensures idempotent processing and provides audit trail
 */

export const webhookEvent = pgTable(
  "webhook_event",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    
    // Source identification
    source: text("source").notNull(), // 'stripe', 'coupontools', 'trackdesk'
    eventId: text("event_id").notNull(), // External event ID (for idempotency)
    eventType: text("event_type").notNull(), // e.g., 'customer.subscription.updated', 'coupon.redeemed'
    
    // Processing status
    status: text("status").notNull().default('pending'), // 'pending', 'processing', 'processed', 'failed', 'skipped'
    processedAt: timestamp("processed_at"),
    
    // Retry tracking
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    nextRetryAt: timestamp("next_retry_at"),
    
    // Payload
    payload: text("payload").notNull(), // Full JSON payload
    headers: text("headers"), // Request headers (JSON)
    
    // Response tracking
    responseStatus: integer("response_status"), // HTTP status code sent back
    responseBody: text("response_body"), // Response we sent
    
    // Error tracking
    error: text("error"), // Error message if failed
    errorStack: text("error_stack"), // Stack trace
    
    // Related entities (for quick lookups)
    userId: text("user_id"), // If event relates to a user
    subscriptionId: text("subscription_id"), // If event relates to a subscription
    dealId: text("deal_id"), // If event relates to a deal
    redemptionId: text("redemption_id"), // If event relates to a redemption
    
    // Verification
    verified: boolean("verified").default(false).notNull(), // Signature verification
    signature: text("signature"), // Webhook signature
    
    // IP and security
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    
    // Metadata
    metadata: text("metadata"), // JSON for additional context
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Unique constraint for idempotency (source + eventId)
    index("webhook_event_source_eventId_idx").on(table.source, table.eventId),
    index("webhook_event_status_idx").on(table.status),
    index("webhook_event_eventType_idx").on(table.eventType),
    index("webhook_event_createdAt_idx").on(table.createdAt),
    index("webhook_event_userId_idx").on(table.userId),
    index("webhook_event_nextRetryAt_idx").on(table.nextRetryAt),
  ],
);

// Webhook logs (detailed processing logs)
export const webhookLog = pgTable(
  "webhook_log",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    webhookEventId: text("webhook_event_id")
      .notNull()
      .references(() => webhookEvent.id, { onDelete: "cascade" }),
    
    // Log details
    level: text("level").notNull(), // 'info', 'warn', 'error', 'debug'
    message: text("message").notNull(),
    context: text("context"), // JSON with additional context
    
    // Timing
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("webhook_log_webhookEventId_idx").on(table.webhookEventId),
    index("webhook_log_level_idx").on(table.level),
    index("webhook_log_timestamp_idx").on(table.timestamp),
  ],
);

// Webhook subscriptions (configuration)
export const webhookSubscription = pgTable(
  "webhook_subscription",
  {
    id: text("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    
    // Source configuration
    source: text("source").notNull(), // 'stripe', 'coupontools', 'trackdesk'
    eventTypes: text("event_types").array().notNull(), // Array of event types to listen for
    
    // Endpoint configuration
    url: text("url").notNull(), // Our webhook endpoint URL
    secret: text("secret"), // Webhook secret for verification
    
    // Status
    active: boolean("active").default(true).notNull(),
    
    // External IDs
    externalId: text("external_id"), // ID from the external service
    
    // Metadata
    metadata: text("metadata"), // JSON for additional config
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("webhook_subscription_source_idx").on(table.source),
    index("webhook_subscription_active_idx").on(table.active),
  ],
);

// Relations
export const webhookEventRelations = relations(webhookEvent, ({ many }) => ({
  logs: many(webhookLog),
}));

export const webhookLogRelations = relations(webhookLog, ({ one }) => ({
  webhookEvent: one(webhookEvent, {
    fields: [webhookLog.webhookEventId],
    references: [webhookEvent.id],
  }),
}));

