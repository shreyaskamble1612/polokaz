CREATE TABLE "deal" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupontools_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"merchant_id" text,
	"merchant_name" text NOT NULL,
	"category" text,
	"deal_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"redemption_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "deal_coupontools_id_unique" UNIQUE("coupontools_id")
);
--> statement-breakpoint
CREATE TABLE "deal_stats" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" text NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"conversion_rate" numeric(5, 2),
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deal_stats" ADD CONSTRAINT "deal_stats_deal_id_deal_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deal"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "deal_status_idx" ON "deal" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "deal_category_idx" ON "deal" USING btree ("category");
--> statement-breakpoint
CREATE INDEX "deal_merchantId_idx" ON "deal" USING btree ("merchant_id");
--> statement-breakpoint
CREATE INDEX "deal_coupontoolsId_idx" ON "deal" USING btree ("coupontools_id");
--> statement-breakpoint
CREATE INDEX "deal_featured_idx" ON "deal" USING btree ("featured");
--> statement-breakpoint
CREATE INDEX "deal_expiresAt_idx" ON "deal" USING btree ("expires_at");
--> statement-breakpoint
CREATE INDEX "deal_stats_dealId_idx" ON "deal_stats" USING btree ("deal_id");
--> statement-breakpoint
CREATE INDEX "deal_stats_date_idx" ON "deal_stats" USING btree ("date");
