# Design: Klient-orkestrert voice session for Vercel

**Dato:** 2026-02-22
**Problem:** Voice-sesjoner bruker WebSockets via `next-ws`, men Vercel støtter ikke WebSockets i serverless functions. Brukere ser "Kobler til..." som aldri fullføres.
**Løsning:** Flytt sesjonsorkestrerering til klienten og erstatt WebSocket med streaming REST API-routes.

## Arkitektur

```
Klient (React)                          Vercel Serverless
─────────────────                       ─────────────────
useSessionOrchestrator
  ├─ PhaseMachine (klient-side)
  ├─ loop per fase:
  │   ├─ POST /api/session/generate ──→ OpenAI streaming → SSE-setninger
  │   ├─ Per setning:
  │   │   POST /api/session/tts ──────→ ElevenLabs → binary audio stream
  │   └─ Spill av audio (useAudioQueue)
  ├─ Pause/resume: lokal state
  └─ POST /api/session/complete ──────→ Lagre til DB + Redis cleanup
```

## API-routes

### POST /api/session/start
- **Input:** `{ character, voice, mood, length, soundscape }`
- **Output:** `{ sessionId, phaseConfig }`
- **Ansvar:** Oppretter sesjon i Redis, returnerer fase-budsjetter
- **Timeout:** 5s

### POST /api/session/generate
- **Input:** `{ sessionId, phase, phaseIndex, previousResponseId, sentencesSoFar }`
- **Output:** Streaming response (text/event-stream) med setninger
- **Ansvar:** Kaller OpenAI GPT-4o-mini streaming, chunker til setninger, safety-filtrerer, sender som SSE events
- **Format:** `data: {"sentence": "...", "index": 0, "phaseComplete": false}\n\n`
- **Timeout:** 25s (Vercel Pro)

### POST /api/session/tts
- **Input:** `{ text, voiceId, previousText }`
- **Output:** Binary stream (audio/mpeg)
- **Ansvar:** Kaller ElevenLabs streaming TTS, pipe'r audio-chunks direkte til response
- **Timeout:** 15s

### POST /api/session/complete
- **Input:** `{ sessionId, totalSentences, phasesCompleted, duration }`
- **Output:** `{ ok: true }`
- **Ansvar:** Lagrer sesjon til PostgreSQL, rydder Redis-state
- **Timeout:** 5s

## Klient-side endringer

### Ny hook: useSessionOrchestrator

Erstatter `useSessionWebSocket`. Ansvar:

1. Kaller `/api/session/start` for å initiere sesjon
2. For hver fase: kaller `/api/session/generate` og leser SSE-strømmen
3. For hver setning: kaller `/api/session/tts` og sender audio-chunks til `useAudioQueue`
4. Styrer fase-overganger basert på `phaseComplete` fra serveren
5. Pause/resume: stopper/starter løkken lokalt
6. Kaller `/api/session/complete` ved avslutning

### Fase-maskin

`phase-machine.ts` flyttes til klient-side. Den er allerede ren logikk uten server-avhengigheter (bare en lineær FSM med 5 faser).

### useAudioQueue

Minimal endring — istedenfor å motta binary WebSocket frames, mottar den chunks fra `fetch()` response body. `ReadableStream`-reader erstatter WebSocket `onmessage`.

### useAmbientAudio

Uendret.

### UI-komponenter

Alle beholdes som de er. `SessionScreen` bytter fra `useSessionWebSocket` til `useSessionOrchestrator` med samme interface.

## Hva fjernes

- `next-ws` dependency + `prepare`-script (`next-ws patch`)
- `src/app/api/session/ws/route.ts` (WebSocket upgrade endpoint)
- `src/lib/ws/session-handler.ts`
- `src/lib/ws/message-types.ts`
- `src/hooks/use-session-ws.ts`

## Hva beholdes uendret

- `src/hooks/use-audio-queue.ts` (minimale endringer til chunk-kilde)
- `src/hooks/use-ambient-audio.ts`
- `src/components/session/*` (alle UI-komponenter)
- `src/lib/tts/tts-service.ts` + `elevenlabs-client.ts`
- `src/lib/llm/generate-session.ts`
- `src/lib/session/phase-config.ts`
- `src/lib/safety/*`

## Nye filer

| Fil | Beskrivelse |
|-----|-------------|
| `src/app/api/session/start/route.ts` | Opprett sesjon |
| `src/app/api/session/generate/route.ts` | Stream tekst med SSE |
| `src/app/api/session/tts/route.ts` | Stream TTS audio |
| `src/app/api/session/complete/route.ts` | Fullfør sesjon |
| `src/hooks/use-session-orchestrator.ts` | Klient-side orkestrering |

## Flytt-kandidater

| Fra | Til |
|-----|-----|
| `src/lib/session/phase-machine.ts` | Brukes direkte fra klient (allerede ren logikk) |
| `src/lib/session/orchestrator.ts` | Logikken splittes: API-del → route, klient-del → hook |

## Risiko og mitigering

| Risiko | Mitigering |
|--------|-----------|
| Vercel 25s timeout per route | Hvert API-kall håndterer maks ~1 fase-runde (5-15s). Godt innenfor grensen. |
| Klient-side orkestrering eksponerer logikk | Fase-maskinen er ikke sensitiv. Safety-filtrering forblir server-side. |
| Nettverksfeil midt i sesjon | Retry-logikk i orkestrator-hooken. Redis-state for gjenopptakelse. |
| Audio-gap ved treg TTS-respons | Eksisterende audio-kø bufrer. Pre-fetch neste setnings TTS mens nåværende spilles. |
