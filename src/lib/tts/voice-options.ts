/**
 * Static voice data for UI display.
 *
 * Separated from elevenlabs-client.ts so client components can import
 * this without pulling in the ElevenLabs SDK (which requires server-side
 * env vars and fails in the browser).
 */

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  preview: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: "LcfcDJNUP1GQjkzn1xUU",
    name: "Emily",
    description: "En leken og utfordrende stemme. Perfekt for de som vil eies.",
    preview: "Leken & kåt",
  },
  {
    id: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    description: "En dyp, erfaren stemme. Hun vet nøyaktig hva hun gjør.",
    preview: "Dyp & dominant",
  },
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "Bella",
    description: "En søt stemme med en mørk side. Hun lokker deg inn i dypet.",
    preview: "Søt & utspekulert",
  },
];

/** Default voice for wellness sessions (Emily -- soft & meditative) */
export const DEFAULT_VOICE_ID = VOICE_OPTIONS[0].id;
