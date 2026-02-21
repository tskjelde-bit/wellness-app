/**
 * TTS module barrel exports.
 *
 * Re-exports the ElevenLabs client, TTS service, and audio pipeline
 * for convenient imports via @/lib/tts.
 */

// ElevenLabs client singleton and configuration
export { elevenlabs, TTS_CONFIG } from "./elevenlabs-client";

// TTS service (sentence -> audio chunks)
export { synthesizeSentence, type SynthesizeOptions } from "./tts-service";

// Audio pipeline (generateSession -> TTS -> AudioChunkEvents)
export {
  streamSessionAudio,
  type AudioChunkEvent,
  type StreamSessionOptions,
} from "./audio-pipeline";
