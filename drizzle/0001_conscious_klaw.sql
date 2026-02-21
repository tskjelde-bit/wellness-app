CREATE TABLE "consent_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"consent_type" varchar(50) NOT NULL,
	"consent_given" boolean NOT NULL,
	"consent_version" varchar(20) NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "age_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tos_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privacy_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;