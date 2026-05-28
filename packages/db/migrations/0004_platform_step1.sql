CREATE TABLE "merchant_application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"company_email" text NOT NULL,
	"company_phone" text NOT NULL,
	"company_address" text NOT NULL,
	"company_website" text,
	"business_type" text NOT NULL,
	"contact_person_one_name" text NOT NULL,
	"contact_person_one_phone" text NOT NULL,
	"contact_person_two_name" text,
	"contact_person_two_phone" text,
	"member_range" text NOT NULL,
	"notes" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "merchantApplication_userId_unique" ON "merchant_application" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "merchantApplication_userId_idx" ON "merchant_application" USING btree ("user_id");
--> statement-breakpoint
CREATE TABLE "referral_clicks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code" text NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL,
	"ip_address_hash" text,
	"converted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_conversions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_id" text,
	"referred_user_id" text,
	"signed_up_at" timestamp DEFAULT now() NOT NULL,
	"reward_granted" boolean DEFAULT false NOT NULL,
	CONSTRAINT "referral_conversions_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action,
	CONSTRAINT "referral_conversions_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX "referral_conversions_referred_user_id_unique" ON "referral_conversions" USING btree ("referred_user_id");
--> statement-breakpoint
CREATE TABLE "commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reason" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "commissions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupontools_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"terms" text,
	"merchant_id" text,
	"category" text NOT NULL,
	"deal_type" text NOT NULL,
	"discount" text,
	"image_url" text,
	"status" text DEFAULT 'pending_moderation' NOT NULL,
	"rejection_reason" text,
	"expires_at" timestamp,
	"redemption_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"merchant_name" text,
	"coupontools_coupon_id" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"discount_value" numeric(10, 2),
	"merchant_logo" text,
	"merchant_website" text,
	"images" text[],
	"thumbnail_url" text,
	"featured" boolean DEFAULT false NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"coupontools_data" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deals_coupontools_id_unique" UNIQUE("coupontools_id"),
	CONSTRAINT "deals_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "deals_category_status_idx" ON "deals" USING btree ("category", "status");
--> statement-breakpoint
CREATE INDEX "deals_category_idx" ON "deals" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "deals_status_idx" ON "deals" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "deals_merchant_id_idx" ON "deals" USING btree ("merchant_id");
--> statement-breakpoint
CREATE INDEX "deals_coupontools_id_idx" ON "deals" USING btree ("coupontools_id");
--> statement-breakpoint
CREATE INDEX "deals_featured_idx" ON "deals" USING btree ("featured");
--> statement-breakpoint
CREATE INDEX "deals_expires_at_idx" ON "deals" USING btree ("expires_at");
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "points_ledger_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE "redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"deal_id" uuid NOT NULL,
	"merchant_id" text NOT NULL,
	"coupontools_event_id" text,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"reward_dispatched" boolean DEFAULT false NOT NULL,
	CONSTRAINT "redemptions_coupontools_event_id_unique" UNIQUE("coupontools_event_id"),
	CONSTRAINT "redemptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "redemptions_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "redemptions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "redemptions_user_id_idx" ON "redemptions" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "redemptions_deal_id_idx" ON "redemptions" USING btree ("deal_id");
--> statement-breakpoint
CREATE INDEX "redemptions_merchant_id_idx" ON "redemptions" USING btree ("merchant_id");
--> statement-breakpoint
CREATE TABLE "wallet_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"deal_id" uuid NOT NULL,
	"status" text DEFAULT 'saved' NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	"redeemed_at" timestamp,
	CONSTRAINT "wallet_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action,
	CONSTRAINT "wallet_items_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE INDEX "wallet_items_user_id_idx" ON "wallet_items" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "wallet_items_deal_id_idx" ON "wallet_items" USING btree ("deal_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_items_user_id_deal_id_unique" ON "wallet_items" USING btree ("user_id", "deal_id");
