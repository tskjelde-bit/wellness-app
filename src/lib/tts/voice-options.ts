/**
 * Static voice data for UI display, with multilingual support.
 *
 * Separated from elevenlabs-client.ts so client components can import
 * this without pulling in the ElevenLabs SDK (which requires server-side
 * env vars and fails in the browser).
 *
 * Supports: 'no' (Norwegian), 'en' (English), 'sv' (Swedish).
 */

import type { Lang } from "@/lib/llm/prompts";

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export interface LocalizedVoiceOption {
  id: string;
  name: string;
  descriptions: Record<Lang, string>;
  previews: Record<Lang, string>;
}

const VOICE_DATA: LocalizedVoiceOption[] = [
  {
    id: "LcfcDJNUP1GQjkzn1xUU",
    name: "Emily",
    descriptions: {
      no: "En leken og utfordrende stemme. Perfekt for de som vil eies.",
      en: "A playful and challenging voice. Perfect for those who want to be owned.",
      sv: "En lekfull och utmanande röst. Perfekt för de som vill ägas.",
    },
    previews: {
      no: "Leken & kåt",
      en: "Playful & horny",
      sv: "Lekfull & kåt",
    },
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    descriptions: {
      no: "En dyp, erfaren stemme. Hun vet nøyaktig hva hun gjør.",
      en: "A deep, experienced voice. She knows exactly what she's doing.",
      sv: "En djup, erfaren röst. Hon vet exakt vad hon gör.",
    },
    previews: {
      no: "Dyp & dominant",
      en: "Deep & dominant",
      sv: "Djup & dominant",
    },
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "Bella",
    descriptions: {
      no: "En søt stemme med en mørk side. Hun lokker deg inn i dypet.",
      en: "A sweet voice with a dark side. She lures you into the depths.",
      sv: "En söt röst med en mörk sida. Hon lockar dig in i djupet.",
    },
    previews: {
      no: "Søt & utspekulert",
      en: "Sweet & calculated",
      sv: "Söt & utspekulerad",
    },
  },
];

/** Get voice options localized to the given language */
export function getVoiceOptions(lang: Lang = 'no'): VoiceOption[] {
  return VOICE_DATA.map((v) => ({
    id: v.id,
    name: v.name,
    description: v.descriptions[lang],
    preview: v.previews[lang],
  }));
}

/** Default Norwegian voice options (backward compatible) */
export const VOICE_OPTIONS: VoiceOption[] = getVoiceOptions('no');

/** Default voice for sessions (Emily) */
export const DEFAULT_VOICE_ID = VOICE_DATA[0].id;
