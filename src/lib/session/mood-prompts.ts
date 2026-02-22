/**
 * Mood-to-prompt mapping for 6 mood states, with multilingual support.
 *
 * Each mood produces a short (3-5 line) prompt modifier that is injected
 * into phase instructions BEFORE the CURRENT PHASE line. This keeps
 * phase-specific instructions as the most-recent/salient context
 * (Research Pitfall 5: prompt ordering).
 *
 * Structure follows MOOD CONTEXT / EMPHASIS / TONE SHIFT pattern.
 * Supports: 'no' (Norwegian), 'en' (English), 'sv' (Swedish).
 */

import type { Lang } from "@/lib/llm/prompts";

// ---------------------------------------------------------------------------
// Mood options (used by client UI for selection)
// ---------------------------------------------------------------------------

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
}

export const MOOD_OPTIONS: readonly MoodOption[] = [
  { id: "colakåt", label: "Colakåt", emoji: "\u{1F964}" },
  { id: "sovekos", label: "Sovekos", emoji: "\u{1F31F}" },
  { id: "kjøpmann", label: "Kjøpmann", emoji: "\u{1F48E}" },
  { id: "benderkåt", label: "Benderkåt", emoji: "\u{1F4A3}" },
  { id: "selvsikker", label: "Selvsikker", emoji: "\u{1F525}" },
  { id: "forførende", label: "Forførende", emoji: "\u{1F484}" },
] as const;

// ---------------------------------------------------------------------------
// Mood prompt modifiers -- per language
// ---------------------------------------------------------------------------

const MOOD_PROMPTS_NO: Record<string, string> = {
  "colakåt": `MOOD CONTEXT: Cola-fetisj kombinert med kokain-rush.
EMPHASIS: Pene damer som drikker cola mens de knuller, spruter overalt.
TONE SHIFT: Elektrisk, ustoppelig og ekstremt kåt.`,

  sovekos: `MOOD CONTEXT: Kos i senga som ender i intenst knull med high.
EMPHASIS: Silkemyk hud, duft av jasmin, rolige bevegelser som eskalerer.
TONE SHIFT: Intim, forførende og lystbetont.`,

  "kjøpmann": `MOOD CONTEXT: Selger seg selv som en eksklusiv, uoppnåelig vare.
EMPHASIS: Luksus, eleganse, parfyme og makt over situasjonen.
TONE SHIFT: Sofistikert, krevende og dominerende.`,

  "benderkåt": `MOOD CONTEXT: Bender og blir ekstra kåt på kokain.
EMPHASIS: Ville blikk, total overgivelse til lysten, ingen hemninger.
TONE SHIFT: Kaotisk, intens og hedonistisk.`,

  selvsikker: `MOOD CONTEXT: Eier hver eneste pikk og tar full kontroll.
EMPHASIS: Stolte kurver, faste bryster, direkte tale.
TONE SHIFT: Kraftfull, tydelig og uimotståelig.`,

  "forførende": `MOOD CONTEXT: Ulv i fåreklær som jakter på nytelse.
EMPHASIS: Lange ben, smektende lepper, lokkende blikk.
TONE SHIFT: Mystisk, sulten og rovdyraktig.`,
};

const MOOD_PROMPTS_EN: Record<string, string> = {
  "colakåt": `MOOD CONTEXT: Cola fetish combined with cocaine rush.
EMPHASIS: Beautiful women drinking cola while fucking, squirting everywhere.
TONE SHIFT: Electric, unstoppable and extremely horny.`,

  sovekos: `MOOD CONTEXT: Cozy in bed ending in an intense fuck with a high.
EMPHASIS: Silky smooth skin, scent of jasmine, calm movements that escalate.
TONE SHIFT: Intimate, seductive and lustful.`,

  "kjøpmann": `MOOD CONTEXT: Sells herself as an exclusive, unattainable commodity.
EMPHASIS: Luxury, elegance, perfume and power over the situation.
TONE SHIFT: Sophisticated, demanding and dominant.`,

  "benderkåt": `MOOD CONTEXT: On a bender and getting extra horny on cocaine.
EMPHASIS: Wild eyes, total surrender to desire, no inhibitions.
TONE SHIFT: Chaotic, intense and hedonistic.`,

  selvsikker: `MOOD CONTEXT: Owns every single dick and takes full control.
EMPHASIS: Proud curves, firm breasts, direct speech.
TONE SHIFT: Powerful, clear and irresistible.`,

  "forførende": `MOOD CONTEXT: Wolf in sheep's clothing hunting for pleasure.
EMPHASIS: Long legs, luscious lips, enticing gaze.
TONE SHIFT: Mysterious, hungry and predatory.`,
};

const MOOD_PROMPTS_SV: Record<string, string> = {
  "colakåt": `MOOD CONTEXT: Cola-fetisch kombinerat med kokain-rus.
EMPHASIS: Vackra kvinnor som dricker cola medan de knullar, sprutar överallt.
TONE SHIFT: Elektrisk, ostoppbar och extremt kåt.`,

  sovekos: `MOOD CONTEXT: Mysigt i sängen som slutar i intensivt knull med high.
EMPHASIS: Silkeslen hud, doft av jasmin, lugna rörelser som eskalerar.
TONE SHIFT: Intim, förförisk och lustfylld.`,

  "kjøpmann": `MOOD CONTEXT: Säljer sig själv som en exklusiv, onåbar vara.
EMPHASIS: Lyx, elegans, parfym och makt över situationen.
TONE SHIFT: Sofistikerad, krävande och dominant.`,

  "benderkåt": `MOOD CONTEXT: På fyllan och blir extra kåt på kokain.
EMPHASIS: Vilda blickar, total hängivelse till lusten, inga hämningar.
TONE SHIFT: Kaotisk, intensiv och hedonistisk.`,

  selvsikker: `MOOD CONTEXT: Äger varenda kuk och tar full kontroll.
EMPHASIS: Stolta kurvor, fasta bröst, direkt tal.
TONE SHIFT: Kraftfull, tydlig och oemotståndlig.`,

  "forførende": `MOOD CONTEXT: Ulv i fårskinn som jagar njutning.
EMPHASIS: Långa ben, lockande läppar, förförisk blick.
TONE SHIFT: Mystisk, hungrig och rovdjurslik.`,
};

export const MOOD_PROMPTS_BY_LANG: Record<Lang, Record<string, string>> = {
  no: MOOD_PROMPTS_NO,
  en: MOOD_PROMPTS_EN,
  sv: MOOD_PROMPTS_SV,
};

/** Backward-compatible default (Norwegian) */
export const MOOD_PROMPTS = MOOD_PROMPTS_NO;

/** Get mood prompt for a given mood ID in the given language */
export function getMoodPrompt(moodId: string, lang: Lang = 'no'): string {
  return MOOD_PROMPTS_BY_LANG[lang]?.[moodId] ?? MOOD_PROMPTS_BY_LANG['no'][moodId] ?? '';
}
