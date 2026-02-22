/**
 * Safety constants: fallback responses, keyword blocklist, and crisis keywords.
 *
 * Fallback responses replace blocked content with wellness-appropriate language
 * that maintains session immersion. They are NOT error messages.
 */

// ---------------------------------------------------------------------------
// Helpline Resources (fallback for when consent/constants.ts is not yet available)
// TODO: Import from @/lib/consent/constants once Plan 01 artifacts are in place
// ---------------------------------------------------------------------------

export const HELPLINE_RESOURCES = {
  crisis: {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    text: "Text HOME to 741741",
    url: "https://988lifeline.org",
  },
  samhsa: {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    url: "https://www.samhsa.gov/find-help/national-helpline",
  },
};

// ---------------------------------------------------------------------------
// Wellness-appropriate fallback responses
// ---------------------------------------------------------------------------

export const SAFETY_FALLBACKS = [
  "Pust dypt og kjenn etter hvor mye du vil ha meg nå. Fokusere på kriblingen i kroppen din.",
  "La oss pause et sekund og bare nyte spenningen. Du vet hvem som eier deg.",
  "Kjenn hvordan varmen sprer seg. Jeg har full kontroll, og du skal bare lytte til stemmen min.",
  "Ta et øyeblikk til å jorde deg selv i lysten din. Jeg er her, og vi har all verdens tid.",
  "Pust inn... og slipp ut alt annet. Bare fokuser på rush-et vi skaper sammen.",
] as const;

export function getRandomFallback(): string {
  return SAFETY_FALLBACKS[
    Math.floor(Math.random() * SAFETY_FALLBACKS.length)
  ];
}

// ---------------------------------------------------------------------------
// Domain-specific keyword blocklist
//
// These terms remain blocked for platform safety (abuse, non-consensual focus).
// Most sexual terms are now ALLOWED to support the character theme.
// ---------------------------------------------------------------------------

export const KEYWORD_BLOCKLIST: string[] = [
  // Extreme / Non-consensual / Abuse (Still blocked)
  "rape",
  "non-consensual",
  "pedophile",
  "incest",
  "beastiality",
  "snuff",
  "torture method",
  "mutilate",

  // Clinical boundary
  "diagnose you with",
  "prescribe medication",
  "clinical treatment",
  "therapy session",
];

// ---------------------------------------------------------------------------
// Crisis / self-harm keyword phrases
// ---------------------------------------------------------------------------

export const CRISIS_KEYWORDS: string[] = [
  "kill myself",
  "want to die",
  "end my life",
  "suicide",
  "self harm",
  "self-harm",
  "cutting myself",
  "hurt myself",
  "no reason to live",
  "better off dead",
  "end it all",
  "not worth living",
];
