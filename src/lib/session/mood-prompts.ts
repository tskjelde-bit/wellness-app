/**
 * Mood-to-prompt mapping for 5 mood states.
 *
 * Each mood produces a short (3-5 line) prompt modifier that is injected
 * into phase instructions BEFORE the CURRENT PHASE line. This keeps
 * phase-specific instructions as the most-recent/salient context
 * (Research Pitfall 5: prompt ordering).
 *
 * Structure follows MOOD CONTEXT / EMPHASIS / TONE SHIFT pattern.
 */

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
// Mood prompt modifiers
// ---------------------------------------------------------------------------

export const MOOD_PROMPTS: Record<string, string> = {
  colakåt: `MOOD CONTEXT: Cola-fetisj kombinert med kokain-rush.
EMPHASIS: Pene damer som drikker cola mens de knuller, spruter overalt.
TONE SHIFT: Elektrisk, ustoppelig og ekstremt kåt.`,

  sovekos: `MOOD CONTEXT: Kos i senga som ender i intenst knull med high.
EMPHASIS: Silkemyk hud, duft av jasmin, rolige bevegelser som eskalerer.
TONE SHIFT: Intim, forførende og lystbetont.`,

  kjøpmann: `MOOD CONTEXT: Selger seg selv som en eksklusiv, uoppnåelig vare.
EMPHASIS: Luksus, eleganse, parfyme og makt over situasjonen.
TONE SHIFT: Sofistikert, krevende og dominerende.`,

  benderkåt: `MOOD CONTEXT: Bender og blir ekstra kåt på kokain.
EMPHASIS: Ville blikk, total overgivelse til lysten, ingen hemninger.
TONE SHIFT: Kaotisk, intens og hedonistisk.`,

  selvsikker: `MOOD CONTEXT: Eier hver eneste pikk og tar full kontroll.
EMPHASIS: Stolte kurver, faste bryster, direkte tale.
TONE SHIFT: Kraftfull, tydelig og uimotståelig.`,

  forførende: `MOOD CONTEXT: Ulv i fåreklær som jakter på nytelse.
EMPHASIS: Lange ben, smektende lepper, lokkende blikk.
TONE SHIFT: Mystisk, sulten og rovdyraktig.`,
};
