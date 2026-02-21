import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  pgEnum,
  uuid,
  real,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// ENUMS
// ============================================================

export const injuryTypeEnum = pgEnum("injury_type", [
  "orthopedic",      // bone, joint, cartilage
  "neurological",    // nerve, spinal
  "muscular",        // muscle tear, strain
  "post_surgical",   // recovery after operation
  "chronic_pain",    // long-term pain management
  "sports_injury",   // acute sports-related
  "workplace_injury",
  "other",
]);

export const bodySiteEnum = pgEnum("body_site", [
  "shoulder",
  "elbow",
  "wrist",
  "hand",
  "spine_cervical",
  "spine_lumbar",
  "hip",
  "knee",
  "ankle",
  "foot",
  "full_body",
  "other",
]);

export const recoveryPhaseEnum = pgEnum("recovery_phase", [
  "acute",        // 0–2 weeks post-injury: pain control, protect tissue
  "subacute",     // 2–6 weeks: gentle mobility, reduce swelling
  "remodeling",   // 6–12 weeks: strength, range of motion
  "functional",   // 3–6 months: return to daily activities
  "maintenance",  // ongoing: prevent re-injury
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "in_progress",
  "completed",
  "skipped",
  "flagged", // patient reported pain above threshold
]);

export const difficultyEnum = pgEnum("difficulty", [
  "very_easy",
  "easy",
  "moderate",
  "challenging",
  "hard",
]);

export const painScaleEnum = pgEnum("pain_scale", [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
]);

// ============================================================
// USERS (adults only — 18+)
// ============================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),

  // Adult verification — this app is for adults (18+) only
  dateOfBirth: timestamp("date_of_birth").notNull(),
  isAdultVerified: boolean("is_adult_verified").default(false).notNull(),

  // Clinical context — set during onboarding, reviewed by patient
  treatingPhysicianName: text("treating_physician_name"),
  physicianContactNote: text("physician_contact_note"), // NOT stored as medical record

  // Preferences
  preferredVoiceGender: text("preferred_voice_gender").default("neutral"),
  sessionReminderEnabled: boolean("session_reminder_enabled").default(true),
  painAlertThreshold: integer("pain_alert_threshold").default(7), // 0–10; sessions flagged above this

  // Consent — must be accepted before any voice or AI interaction
  hasAcceptedTerms: boolean("has_accepted_terms").default(false).notNull(),
  hasAcceptedMedicalDisclaimer: boolean("has_accepted_medical_disclaimer")
    .default(false)
    .notNull(),
  termsAcceptedAt: timestamp("terms_accepted_at"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// INJURY PROFILES
// One user can have multiple injury profiles (e.g., knee AND shoulder)
// ============================================================

export const injuryProfiles = pgTable("injury_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  injuryType: injuryTypeEnum("injury_type").notNull(),
  bodySite: bodySiteEnum("body_site").notNull(),
  injuryDescription: text("injury_description"), // patient's own words — not a diagnosis
  injuryDate: timestamp("injury_date"),
  surgeryDate: timestamp("surgery_date"),
  currentPhase: recoveryPhaseEnum("current_phase").notNull().default("acute"),

  // Goals set by the patient (not prescribed by the app)
  patientGoal: text("patient_goal"), // e.g., "walk 2km without pain", "return to cycling"

  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// EXERCISE LIBRARY
// Curated exercises — never auto-prescribed without phase check
// ============================================================

export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: text("name").notNull(),
  description: text("description").notNull(),

  // Which phases this exercise is safe for
  suitablePhases: recoveryPhaseEnum("suitable_phases").array().notNull(),

  // Body sites this exercise targets
  targetSites: bodySiteEnum("target_sites").array().notNull(),

  difficulty: difficultyEnum("difficulty").notNull().default("easy"),

  // Defaults — overridden per session plan
  defaultSets: integer("default_sets").default(3),
  defaultReps: integer("default_reps").default(10),
  defaultHoldSeconds: integer("default_hold_seconds"), // for isometric holds
  defaultRestSeconds: integer("default_rest_seconds").default(30),

  // Voice coaching script — fed to ElevenLabs TTS
  // Must comply with voice guardrails (see voice/guardrails.ts)
  voiceCueIntro: text("voice_cue_intro").notNull(),
  voiceCueExecution: text("voice_cue_execution").notNull(),
  voiceCueCompletion: text("voice_cue_completion").notNull(),

  // Safety
  contraindicationNotes: text("contraindication_notes"), // internal only, never voiced to patient
  requiresEquipment: boolean("requires_equipment").default(false),
  equipmentList: text("equipment_list").array(),

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// SESSION PLANS
// A plan = a scheduled rehabilitation session for a user
// ============================================================

export const sessionPlans = pgTable("session_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  injuryProfileId: uuid("injury_profile_id")
    .notNull()
    .references(() => injuryProfiles.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  estimatedDurationMinutes: integer("estimated_duration_minutes").default(20),
  status: sessionStatusEnum("status").default("scheduled").notNull(),

  // Ordered list of exercise IDs with per-session overrides
  exerciseConfig: jsonb("exercise_config").notNull().$type<
    Array<{
      exerciseId: string;
      sets: number;
      reps?: number;
      holdSeconds?: number;
      restSeconds: number;
      notes?: string; // physiotherapist note, displayed as text only
    }>
  >(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================
// SESSION LOGS
// What actually happened during a completed session
// ============================================================

export const sessionLogs = pgTable("session_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionPlanId: uuid("session_plan_id")
    .notNull()
    .references(() => sessionPlans.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  actualDurationMinutes: integer("actual_duration_minutes"),

  // Pain reported at start and end (0–10)
  painScoreStart: integer("pain_score_start"),
  painScoreEnd: integer("pain_score_end"),

  // Was session flagged due to pain above threshold?
  wasFlagged: boolean("was_flagged").default(false).notNull(),
  flagReason: text("flag_reason"), // logged when wasFlagged = true

  // Per-exercise completion data
  exerciseResults: jsonb("exercise_results").$type<
    Array<{
      exerciseId: string;
      completed: boolean;
      setsCompleted: number;
      repsCompleted?: number;
      painDuringExercise?: number; // 0–10
      patientNote?: string;
    }>
  >(),

  // Voice session transcript reference (stored in Redis TTL=30d)
  voiceSessionKey: text("voice_session_key"),

  overallFeedback: text("overall_feedback"), // patient free text
  perceivedExertion: integer("perceived_exertion"), // Borg scale 6–20

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// PROGRESS SNAPSHOTS
// Weekly summary — used for charts and AI progress analysis
// ============================================================

export const progressSnapshots = pgTable("progress_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  injuryProfileId: uuid("injury_profile_id")
    .notNull()
    .references(() => injuryProfiles.id),

  weekStartDate: timestamp("week_start_date").notNull(),

  sessionsCompleted: integer("sessions_completed").default(0),
  sessionsSkipped: integer("sessions_skipped").default(0),
  sessionsFlagged: integer("sessions_flagged").default(0),

  avgPainStart: real("avg_pain_start"),
  avgPainEnd: real("avg_pain_end"),
  avgPerceivedExertion: real("avg_perceived_exertion"),

  // AI-generated plain-language summary (OpenAI)
  // Subject to the same guardrails as voice — no diagnoses, no prognosis
  aiSummary: text("ai_summary"),

  currentPhase: recoveryPhaseEnum("current_phase").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================
// NEXTAUTH REQUIRED TABLES
// ============================================================

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// ============================================================
// RELATIONS
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  injuryProfiles: many(injuryProfiles),
  sessionPlans: many(sessionPlans),
  sessionLogs: many(sessionLogs),
  progressSnapshots: many(progressSnapshots),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const injuryProfilesRelations = relations(
  injuryProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [injuryProfiles.userId],
      references: [users.id],
    }),
    sessionPlans: many(sessionPlans),
    progressSnapshots: many(progressSnapshots),
  })
);

export const sessionPlansRelations = relations(sessionPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [sessionPlans.userId],
    references: [users.id],
  }),
  injuryProfile: one(injuryProfiles, {
    fields: [sessionPlans.injuryProfileId],
    references: [injuryProfiles.id],
  }),
  logs: many(sessionLogs),
}));

export const sessionLogsRelations = relations(sessionLogs, ({ one }) => ({
  sessionPlan: one(sessionPlans, {
    fields: [sessionLogs.sessionPlanId],
    references: [sessionPlans.id],
  }),
  user: one(users, {
    fields: [sessionLogs.userId],
    references: [users.id],
  }),
}));
