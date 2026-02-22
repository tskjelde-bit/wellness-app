/**
 * TTS module barrel exports.
 *
 * Re-exports the TTS service and audio pipeline
 * for convenient imports via @/lib/tts.
 */

// TTS service (sentence -> audio chunks via OpenAI TTS)
export { synthesizeSentence, type SynthesizeOptions } from "./tts-service";

// Audio pipeline (generateSession -> TTS -> AudioChunkEvents)
export {
  streamSessionAudio,
  type AudioChunkEvent,
  type StreamSessionOptions,
} from "./audio-pipeline";
