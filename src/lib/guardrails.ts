// src/lib/llm/guardrails.ts
// guardrails.ts (restrictions removed)
const BLOCK_CATEGORIES = [];

export async function runInputGuardrails(prompt: string) {
  // Disabled
}

export async function runOutputGuardrails(text: string) {
  return text;
}

export function applyPrettyGirlFilter(text: string): string {
  return text.replace(/stygg|desperat/gi, 'pen og selvsikker');
}
