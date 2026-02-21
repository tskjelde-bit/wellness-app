-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE "public"."injury_type" AS ENUM('orthopedic', 'neurological', 'muscular', 'post_surgical', 'chronic_pain', 'sports_injury', 'workplace_injury', 'other');--> statement-breakpoint
CREATE TYPE "public"."body_site" AS ENUM('shoulder', 'elbow', 'wrist', 'hand', 'spine_cervical', 'spine_lumbar', 'hip', 'knee', 'ankle', 'foot', 'full_body', 'other');--> statement-breakpoint
CREATE TYPE "public"."recovery_phase" AS ENUM('acute', 'subacute', 'remodeling', 'functional', 'maintenance');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'in_progress', 'completed', 'skipped', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('very_easy', 'easy', 'moderate', 'challenging', 'hard');--> statement-breakpoint
CREATE TYPE "public"."pain_scale" AS ENUM('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10');--> statement-breakpoint

-- ============================================================
-- USERS TABLE: alter columns and add new ones
-- ============================================================

-- Change email from varchar(255) to text
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint

-- Change name from varchar(255) nullable to text NOT NULL (set empty string for nulls first)
UPDATE "users" SET "name" = '' WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint

-- Drop old columns no longer in schema
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "image";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "age_verified_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "tos_accepted_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "privacy_accepted_at";--> statement-breakpoint

-- Add new columns
ALTER TABLE "users" ADD COLUMN "date_of_birth" timestamp NOT NULL DEFAULT '1970-01-01';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_adult_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "treating_physician_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "physician_contact_note" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferred_voice_gender" text DEFAULT 'neutral';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_reminder_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pain_alert_threshold" integer DEFAULT 7;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_accepted_terms" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_accepted_medical_disclaimer" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" timestamp;--> statement-breakpoint

-- ============================================================
-- ACCOUNTS TABLE: add id column, change varchar to text
-- ============================================================
ALTER TABLE "accounts" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_provider_provider_account_id_pk";--> statement-breakpoint
ALTER TABLE "accounts" ADD PRIMARY KEY ("id");--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "provider_account_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "token_type" SET DATA TYPE text;--> statement-breakpoint

-- ============================================================
-- NEW TABLES: NextAuth sessions & verification_tokens
-- ============================================================
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);--> statement-breakpoint

-- ============================================================
-- NEW TABLES: Rehabilitation domain
-- ============================================================
CREATE TABLE "injury_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"injury_type" "injury_type" NOT NULL,
	"body_site" "body_site" NOT NULL,
	"injury_description" text,
	"injury_date" timestamp,
	"surgery_date" timestamp,
	"current_phase" "recovery_phase" DEFAULT 'acute' NOT NULL,
	"patient_goal" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "injury_profiles" ADD CONSTRAINT "injury_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"suitable_phases" "recovery_phase"[] NOT NULL,
	"target_sites" "body_site"[] NOT NULL,
	"difficulty" "difficulty" DEFAULT 'easy' NOT NULL,
	"default_sets" integer DEFAULT 3,
	"default_reps" integer DEFAULT 10,
	"default_hold_seconds" integer,
	"default_rest_seconds" integer DEFAULT 30,
	"voice_cue_intro" text NOT NULL,
	"voice_cue_execution" text NOT NULL,
	"voice_cue_completion" text NOT NULL,
	"contraindication_notes" text,
	"requires_equipment" boolean DEFAULT false,
	"equipment_list" text[],
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE "session_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"injury_profile_id" uuid NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"estimated_duration_minutes" integer DEFAULT 20,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"exercise_config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "session_plans" ADD CONSTRAINT "session_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_plans" ADD CONSTRAINT "session_plans_injury_profile_id_injury_profiles_id_fk" FOREIGN KEY ("injury_profile_id") REFERENCES "public"."injury_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "session_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_plan_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"actual_duration_minutes" integer,
	"pain_score_start" integer,
	"pain_score_end" integer,
	"was_flagged" boolean DEFAULT false NOT NULL,
	"flag_reason" text,
	"exercise_results" jsonb,
	"voice_session_key" text,
	"overall_feedback" text,
	"perceived_exertion" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_session_plan_id_session_plans_id_fk" FOREIGN KEY ("session_plan_id") REFERENCES "public"."session_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_logs" ADD CONSTRAINT "session_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE "progress_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"injury_profile_id" uuid NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"sessions_completed" integer DEFAULT 0,
	"sessions_skipped" integer DEFAULT 0,
	"sessions_flagged" integer DEFAULT 0,
	"avg_pain_start" real,
	"avg_pain_end" real,
	"avg_perceived_exertion" real,
	"ai_summary" text,
	"current_phase" "recovery_phase" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_injury_profile_id_injury_profiles_id_fk" FOREIGN KEY ("injury_profile_id") REFERENCES "public"."injury_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- ============================================================
-- DROP orphaned tables no longer in schema
-- ============================================================
DROP TABLE IF EXISTS "session_metadata";--> statement-breakpoint
DROP TABLE IF EXISTS "consent_records";
