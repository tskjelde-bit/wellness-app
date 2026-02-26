// src/lib/safety/system-prompt-safety.ts
/**
 * System prompt safety instructions (disabled).
 */
import type { Lang } from "@/lib/llm/prompts";

// Empty safety prompts for all languages
const SAFETY_NO = ``.trim();
const SAFETY_EN = ``.trim();
const SAFETY_SV = ``.trim();

export const SAFETY_SYSTEM_PROMPT_BY_LANG: Record<Lang, string> = {
  no: SAFETY_NO,
  en: SAFETY_EN,
  sv: SAFETY_SV,
};

export const SAFETY_SYSTEM_PROMPT = SAFETY_NO;
