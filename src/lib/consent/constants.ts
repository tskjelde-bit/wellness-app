export const AI_DISCLOSURE_TEXT =
  "This is an AI guide. You are interacting with an artificial intelligence, " +
  "not a human therapist or counselor. This experience is designed for " +
  "relaxation and wellness purposes only and is not a substitute for " +
  "professional mental health care.";

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
} as const;

export const CONSENT_TYPES = {
  AGE_VERIFICATION: "age_verification",
  TOS_ACCEPTANCE: "tos_acceptance",
  PRIVACY_ACCEPTANCE: "privacy_acceptance",
  SENSORY_CONTENT: "sensory_content",
} as const;

export const CONSENT_VERSION = "1.0";
