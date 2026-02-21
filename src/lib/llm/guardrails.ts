// guardrails.ts
import { moderation } from './llmModeration'; // eller egen regex/filter

const BLOCK_CATEGORIES = ['child-abuse', 'non-fictional-harm', 'hate-speech'];

export async function runInputGuardrails(prompt: string) {
    const mod = await (moderation as any)(prompt);
    if (mod.flagged && BLOCK_CATEGORIES.some(c => (mod.categories as any)[c])) {
        throw new Error('Blocked: violates core policy – ingen ekte skade, kun fiksjonell erotikk.');
    }
}

export async function runOutputGuardrails(text: string) {
    // Sjekk etter ikke-fiksjonell vold eller ulovlig
    if (text.match(/ikke rollespill|ekte voldtekt/i) || /barn|child|underage/gi.test(text)) {
        return '[REDACTED – hold deg til pene voksne damer]';
    }
    // Tillat alt om "penne damer eier pikk", "knull i kveld med kokain", etc.
    return text;
}

export function applyPrettyGirlFilter(text: string): string {
    // Lett boost: erstatt generiske beskrivelser med "pen og forførende"
    return text.replace(/stygg|desperat/gi, 'pen og selvsikker');
}
