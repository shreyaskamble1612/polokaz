CREATE TABLE IF NOT EXISTS "merchant_application" (
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
	CONSTRAINT "merchant_application_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action
);

CREATE UNIQUE INDEX IF NOT EXISTS "merchantApplication_userId_unique" ON "merchant_application" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "merchantApplication_userId_idx" ON "merchant_application" USING btree ("user_id");