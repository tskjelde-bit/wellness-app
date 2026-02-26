/**
 * Seed all 9 admin config sections with current hardcoded defaults.
 *
 * Usage: npx tsx scripts/seed-config.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

// Import the hardcoded values directly
import { SYSTEM_BASE_BY_LANG, JAILBREAK_V1_BY_LANG, buildCharacterPrompt } from "../src/lib/llm/prompts";
import { PHASE_PROPORTIONS } from "../src/lib/session/phase-config";
import { MOOD_OPTIONS, MOOD_PROMPTS_BY_LANG } from "../src/lib/session/mood-prompts";
import { SAFETY_SYSTEM_PROMPT_BY_LANG } from "../src/lib/llm/safety/system-prompt-safety";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const SECTIONS: Record<string, Record<string, unknown>> = {
  prompts: {
    systemBase: { ...SYSTEM_BASE_BY_LANG },
    jailbreak: { ...JAILBREAK_V1_BY_LANG },
    characters: {
      Thea: { no: buildCharacterPrompt("Thea", "no"), en: buildCharacterPrompt("Thea", "en"), sv: buildCharacterPrompt("Thea", "sv") },
      Mari: { no: buildCharacterPrompt("Mari", "no"), en: buildCharacterPrompt("Mari", "en"), sv: buildCharacterPrompt("Mari", "sv") },
      Milfen: { no: buildCharacterPrompt("Milfen", "no"), en: buildCharacterPrompt("Milfen", "en"), sv: buildCharacterPrompt("Milfen", "sv") },
    },
  },
  llm_settings: {
    model: "gpt-4o-mini",
    temperature: 0.8,
    maxOutputTokens: 4096,
  },
  phase_config: {
    proportions: { ...PHASE_PROPORTIONS },
    sentencesPerMinute: 13,
  },
  phase_prompts: {
    // Phase prompts are imported dynamically in runtime;
    // for seeding we use a placeholder that signals "use file defaults"
    phasePrompts: {},
    transitionHints: {},
  },
  mood_prompts: {
    options: [...MOOD_OPTIONS],
    prompts: {
      no: { ...MOOD_PROMPTS_BY_LANG.no },
      en: { ...MOOD_PROMPTS_BY_LANG.en },
      sv: { ...MOOD_PROMPTS_BY_LANG.sv },
    },
  },
  safety: {
    safetyPrompts: { ...SAFETY_SYSTEM_PROMPT_BY_LANG },
    blockedKeywords: [],
    enableGuardrails: false,
  },
  translations: {
    "app.title": { no: "Wellness & Sensory Connection", en: "Wellness & Sensory Connection", sv: "Wellness & Sensory Connection" },
    "app.start_session": { no: "Start økt", en: "Start session", sv: "Starta session" },
    "app.select_mood": { no: "Velg stemning", en: "Select mood", sv: "Välj stämning" },
  },
  consent: {
    termsText: { no: "", en: "", sv: "" },
    disclaimerText: { no: "", en: "", sv: "" },
    helplines: { no: "", en: "", sv: "" },
  },
  voice_options: {
    voices: [],
    defaultVoiceId: "",
  },
};

async function main() {
  console.log("Seeding admin config sections...\n");

  for (const [section, data] of Object.entries(SECTIONS)) {
    const [existing] = await db
      .select()
      .from(schema.adminConfig)
      .where(eq(schema.adminConfig.section, section))
      .limit(1);

    if (existing) {
      console.log(`  [skip] ${section} — already exists (v${existing.version})`);
      continue;
    }

    await db.insert(schema.adminConfig).values({
      section,
      data,
      version: 1,
    });

    console.log(`  [seed] ${section} — inserted`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
