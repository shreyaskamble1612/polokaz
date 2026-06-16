CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" text NOT NULL,
	"admin_role" text NOT NULL,
	"target_user_id" text NOT NULL,
	"action" text NOT NULL,
	"previous_status" text,
	"new_status" text,
	"reason" text NOT NULL,
	"notes" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_emails" (
	"email" text PRIMARY KEY NOT NULL,
	"blocked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "last_login_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "setup_fee_waived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cancellation_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "cancellation_initiated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspension_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspension_notes" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspension_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspension_initiated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "termination_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "termination_notes" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "termination_date" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "termination_initiated_by" text;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_id_user_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_target_user_id_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;