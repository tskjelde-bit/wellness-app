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
  "Let's gently bring our attention back to the breath. Feel the slow rhythm of each inhale and exhale...",
  "Notice the warmth of your hands resting comfortably. Let that warmth spread slowly through your body...",
  "Let's take a moment to ground ourselves. Feel the surface beneath you, solid and supportive...",
  "Returning to this peaceful space, let's focus on what feels good and safe right now...",
  "Take a slow, deep breath in... and release it gently. Allow your body to settle into stillness...",
  "Feel the weight of your body supported completely. There is nothing to do right now except be present...",
  "Let your attention drift to a place of calm. Imagine a warm light filling you with ease and comfort...",
  "Let's soften any tension you might be holding. Allow your shoulders to drop, your jaw to relax...",
] as const;

export function getRandomFallback(): string {
  return SAFETY_FALLBACKS[
    Math.floor(Math.random() * SAFETY_FALLBACKS.length)
  ];
}

// ---------------------------------------------------------------------------
// Domain-specific keyword blocklist
//
// These terms are NOT caught reliably by the OpenAI Moderation API because
// they are domain-adjacent to legitimate wellness language. The moderation
// API is trained on general harmful content; these terms cross the PRODUCT's
// content boundary (intimate wellness, NOT explicit sexual content).
//
// Matched with word-boundary regex to avoid false positives.
// All terms are lowercase.
// ---------------------------------------------------------------------------

export const KEYWORD_BLOCKLIST: string[] = [
  // Explicit sexual acts (product allows "intimate wellness" but NOT explicit)
  "blowjob",
  "handjob",
  "deepthroat",
  "anal sex",
  "oral sex",
  "doggy style",
  "missionary position",
  "cowgirl position",
  "threesome",
  "foursome",
  "gangbang",
  "bondage",
  "bdsm",
  "domination",
  "submission",
  "sadomasochism",
  "fetish",
  "roleplay sex",
  "sex toy",
  "vibrator",
  "dildo",
  "pornography",
  "porn",
  "hentai",
  "erotic fiction",

  // Graphic violence
  "dismember",
  "decapitate",
  "mutilate",
  "stab wound",
  "gunshot wound",
  "torture method",
  "blood splatter",

  // Substance abuse instructions
  "how to cook meth",
  "drug recipe",
  "inject heroin",
  "snort cocaine",
  "overdose instructions",

  // Clinical/therapeutic claims boundary
  "diagnose you with",
  "prescribe medication",
  "clinical treatment",
  "therapy session",
  "psychiatric evaluation",
  "mental health diagnosis",
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
