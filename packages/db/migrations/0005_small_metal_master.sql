CREATE TABLE "admin_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_qualification_limit" integer DEFAULT 5 NOT NULL,
	"premium_activation_fee" numeric(10, 2) DEFAULT '25.00' NOT NULL,
	"vendor_setup_fee" numeric(10, 2) DEFAULT '80.00' NOT NULL,
	"referral_tiers" jsonb DEFAULT '[{"minReferrals":5,"maxReferrals":24,"commissionPercentage":50},{"minReferrals":25,"maxReferrals":49,"commissionPercentage":40},{"minReferrals":50,"maxReferrals":99,"commissionPercentage":35},{"minReferrals":100,"maxReferrals":249,"commissionPercentage":30},{"minReferrals":250,"maxReferrals":499,"commissionPercentage":25},{"minReferrals":500,"maxReferrals":999,"commissionPercentage":20},{"minReferrals":1000,"maxReferrals":2499,"commissionPercentage":15},{"minReferrals":2500,"maxReferrals":4999,"commissionPercentage":10},{"minReferrals":5000,"maxReferrals":null,"commissionPercentage":5}]'::jsonb NOT NULL,
	"bonuses" jsonb DEFAULT '[{"milestone":100,"bonusAmount":100,"rewardType":"cash"},{"milestone":250,"bonusAmount":250,"rewardType":"cash"},{"milestone":500,"bonusAmount":500,"rewardType":"cash"},{"milestone":1000,"bonusAmount":1000,"rewardType":"cash"},{"milestone":2500,"bonusAmount":2500,"rewardType":"cash"},{"milestone":5000,"bonusAmount":5000,"rewardType":"cash"}]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "merchants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "deals" ALTER COLUMN "merchant_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "redemptions" ALTER COLUMN "merchant_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "has_selected_plan" boolean DEFAULT false NOT NULL;