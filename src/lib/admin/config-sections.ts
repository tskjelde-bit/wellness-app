/**
 * Typed config getters for each admin config section.
 * Each getter: try DB → fallback to hardcoded file values.
 */
import { getConfig } from "./config-loader";
import type { Lang } from "@/lib/llm/prompts";
import { SYSTEM_BASE_BY_LANG, JAILBREAK_V1_BY_LANG, buildCharacterPrompt } from "@/lib/llm/prompts";
import type { SessionPhase } from "@/lib/session/phase-machine";
import { PHASE_PROPORTIONS } from "@/lib/session/phase-config";
import { MOOD_OPTIONS, MOOD_PROMPTS_BY_LANG } from "@/lib/session/mood-prompts";
import { SAFETY_SYSTEM_PROMPT_BY_LANG } from "@/lib/llm/safety/system-prompt-safety";

// ---------------------------------------------------------------------------
// Valid sections
// ---------------------------------------------------------------------------

export const CONFIG_SECTIONS = [
  "prompts",
  "llm_settings",
  "phase_config",
  "phase_prompts",
  "mood_prompts",
  "safety",
  "translations",
  "consent",
  "voice_options",
] as const;

export type ConfigSection = (typeof CONFIG_SECTIONS)[number];

export function isValidSection(s: string): s is ConfigSection {
  return CONFIG_SECTIONS.includes(s as ConfigSection);
}

// ---------------------------------------------------------------------------
// Section types
// ---------------------------------------------------------------------------

export interface PromptsConfig {
  systemBase: Record<Lang, string>;
  jailbreak: Record<Lang, string>;
  characters: Record<string, Record<string, string>>;
}

export interface LlmSettingsConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface PhaseConfigData {
  proportions: Record<SessionPhase, number>;
  sentencesPerMinute: number;
}

export interface PhasePromptsConfig {
  phasePrompts: Record<Lang, Record<SessionPhase, string>>;
  transitionHints: Record<Lang, Record<SessionPhase, string>>;
}

export interface MoodPromptsConfig {
  options: Array<{ id: string; label: string; emoji: string }>;
  prompts: Record<Lang, Record<string, string>>;
}

export interface SafetyConfig {
  safetyPrompts: Record<Lang, string>;
  blockedKeywords: string[];
  enableGuardrails: boolean;
}

export type TranslationsConfig = Record<string, Record<string, string>>;

export interface ConsentConfig {
  termsText: Record<Lang, string>;
  disclaimerText: Record<Lang, string>;
  helplines: Record<Lang, string>;
}

export interface VoiceOptionsConfig {
  voices: Array<{
    id: string;
    name: string;
    gender: string;
    provider: string;
    voiceId: string;
  }>;
  defaultVoiceId: string;
}

// ---------------------------------------------------------------------------
// Typed getters
// ---------------------------------------------------------------------------

export async function getPromptsConfig(): Promise<PromptsConfig> {
  const dbConfig = await getConfig<PromptsConfig>("prompts");
  if (dbConfig?.systemBase) return dbConfig;

  return {
    systemBase: { ...SYSTEM_BASE_BY_LANG },
    jailbreak: { ...JAILBREAK_V1_BY_LANG },
    characters: {
      Thea: { no: buildCharacterPrompt("Thea", "no"), en: buildCharacterPrompt("Thea", "en"), sv: buildCharacterPrompt("Thea", "sv") },
      Mari: { no: buildCharacterPrompt("Mari", "no"), en: buildCharacterPrompt("Mari", "en"), sv: buildCharacterPrompt("Mari", "sv") },
      Milfen: { no: buildCharacterPrompt("Milfen", "no"), en: buildCharacterPrompt("Milfen", "en"), sv: buildCharacterPrompt("Milfen", "sv") },
    },
  };
}

export async function getLlmSettingsConfig(): Promise<LlmSettingsConfig> {
  const dbConfig = await getConfig<LlmSettingsConfig>("llm_settings");
  if (dbConfig?.model) return dbConfig;

  return {
    model: "grok-3-mini",
    temperature: 0.8,
    maxOutputTokens: 4096,
  };
}

export async function getPhaseConfigData(): Promise<PhaseConfigData> {
  const dbConfig = await getConfig<PhaseConfigData>("phase_config");
  if (dbConfig?.proportions) return dbConfig;

  return {
    proportions: { ...PHASE_PROPORTIONS },
    sentencesPerMinute: 13,
  };
}

export async function getPhasePromptsConfig(): Promise<PhasePromptsConfig> {
  const dbConfig = await getConfig<PhasePromptsConfig>("phase_prompts");
  if (dbConfig?.phasePrompts) return dbConfig;

  const { ALL_PHASE_PROMPTS, ALL_TRANSITION_HINTS } = await import("@/lib/session/phase-prompts");

  return {
    phasePrompts: {
      no: { ...ALL_PHASE_PROMPTS.no },
      en: { ...ALL_PHASE_PROMPTS.en },
      sv: { ...ALL_PHASE_PROMPTS.sv },
    },
    transitionHints: {
      no: { ...ALL_TRANSITION_HINTS.no },
      en: { ...ALL_TRANSITION_HINTS.en },
      sv: { ...ALL_TRANSITION_HINTS.sv },
    },
  };
}

export async function getMoodPromptsConfig(): Promise<MoodPromptsConfig> {
  const dbConfig = await getConfig<MoodPromptsConfig>("mood_prompts");
  if (dbConfig?.options) return dbConfig;

  return {
    options: [...MOOD_OPTIONS],
    prompts: {
      no: { ...MOOD_PROMPTS_BY_LANG.no },
      en: { ...MOOD_PROMPTS_BY_LANG.en },
      sv: { ...MOOD_PROMPTS_BY_LANG.sv },
    },
  };
}

export async function getSafetyConfig(): Promise<SafetyConfig> {
  const dbConfig = await getConfig<SafetyConfig>("safety");
  if (dbConfig?.safetyPrompts) return dbConfig;

  return {
    safetyPrompts: { ...SAFETY_SYSTEM_PROMPT_BY_LANG },
    blockedKeywords: [],
    enableGuardrails: false,
  };
}

export async function getTranslationsConfig(): Promise<TranslationsConfig> {
  const dbConfig = await getConfig<TranslationsConfig>("translations");
  if (dbConfig && Object.keys(dbConfig).length > 0) return dbConfig;

  return {
    "app.title": { no: "Wellness & Sensory Connection", en: "Wellness & Sensory Connection", sv: "Wellness & Sensory Connection" },
    "app.start_session": { no: "Start økt", en: "Start session", sv: "Starta session" },
    "app.select_mood": { no: "Velg stemning", en: "Select mood", sv: "Välj stämning" },
  };
}

export async function getConsentConfig(): Promise<ConsentConfig> {
  const dbConfig = await getConfig<ConsentConfig>("consent");
  if (dbConfig?.termsText) return dbConfig;

  return {
    termsText: { no: "", en: "", sv: "" },
    disclaimerText: { no: "", en: "", sv: "" },
    helplines: { no: "", en: "", sv: "" },
  };
}

export async function getVoiceOptionsConfig(): Promise<VoiceOptionsConfig> {
  const dbConfig = await getConfig<VoiceOptionsConfig>("voice_options");
  if (dbConfig?.voices) return dbConfig;

  return {
    voices: [],
    defaultVoiceId: "",
  };
}

// ---------------------------------------------------------------------------
// Get defaults for a section (for seeding)
// ---------------------------------------------------------------------------

export async function getDefaultConfigForSection(section: ConfigSection): Promise<Record<string, unknown>> {
  switch (section) {
    case "prompts": return await getPromptsConfig() as unknown as Record<string, unknown>;
    case "llm_settings": return await getLlmSettingsConfig() as unknown as Record<string, unknown>;
    case "phase_config": return await getPhaseConfigData() as unknown as Record<string, unknown>;
    case "phase_prompts": return await getMoodPromptsConfig() as unknown as Record<string, unknown>; // fallback
    case "mood_prompts": return await getMoodPromptsConfig() as unknown as Record<string, unknown>;
    case "safety": return await getSafetyConfig() as unknown as Record<string, unknown>;
    case "translations": return await getTranslationsConfig() as unknown as Record<string, unknown>;
    case "consent": return await getConsentConfig() as unknown as Record<string, unknown>;
    case "voice_options": return await getVoiceOptionsConfig() as unknown as Record<string, unknown>;
  }
}
