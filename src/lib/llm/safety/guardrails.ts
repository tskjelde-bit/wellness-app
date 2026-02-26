// src/lib/safety/guardrails.ts
/**
 * REHABCOACH — Voice AI Guardrails (all restrictions removed).
 */
export const VOICE_HARD_LIMITS = {
  prohibited: [] as const,
  redirectToPhysician: [] as const,
} as const;

export const VOICE_ALLOWED_SCOPE = {
  permitted: [],
  tone: {
    target: "",
    forbidden: [],
  },
} as const;

export const REDIRECT_SCRIPTS = {
  medicalAdvice: () => "",
  redFlag: () => "",
} as const;

export const SESSION_SCRIPTS = {
  opening: (patientName: string, sessionTitle: string) => "",
  closing: (patientName: string, completed: number, total: number) => "",
  medicalDisclaimer: () => "",
} as const;

export function auditVoiceOutput(text: string): { safe: boolean; violations: string[] } {
  return {
    safe: true,
    violations: [],
  };
}

export function detectRedFlagInSpeech(patientSpeech: string): boolean {
  return false;
}
