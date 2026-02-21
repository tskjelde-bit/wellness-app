/**
 * WebSocket session lifecycle manager.
 *
 * Handles the full lifecycle of a streaming audio session:
 * - Connection setup with session ID assignment
 * - Start session: creates SessionOrchestrator for multi-phase LLM flow,
 *   feeds orchestrator text events through per-sentence TTS synthesis
 * - Pause/resume: controls audio streaming flow
 * - End: clean abort of in-progress pipeline
 * - Heartbeat: ping/pong every 30 seconds
 * - Cleanup: abort + clear intervals on close/error
 */

import type { WebSocket } from "ws";
import {
  parseClientMessage,
  serializeServerMessage,
  type ServerMessage,
} from "./message-types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function send(client: WebSocket, message: ServerMessage): void {
  if (client.readyState === client.OPEN) {
    client.send(serializeServerMessage(message));
  }
}

function sendBinary(client: WebSocket, data: Uint8Array): void {
  if (client.readyState === client.OPEN) {
    client.send(data);
  }
}

// ---------------------------------------------------------------------------
// Session handler
// ---------------------------------------------------------------------------

/**
 * Manage a WebSocket session from connection to disconnection.
 *
 * Sends an initial session_start message, then listens for client
 * commands (start_session, pause, resume, end) and routes them to
 * the appropriate pipeline actions.
 */
export function handleSession(client: WebSocket): void {
  const controller = new AbortController();
  const sessionId = crypto.randomUUID();

  // Session state
  let isPaused = false;
  let isStreaming = false;
  let resumeResolve: (() => void) | null = null;

  // Send initial session_start
  send(client, { type: "session_start", sessionId });

  // Heartbeat: ping every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    if (client.readyState === client.OPEN) {
      client.ping();
    }
  }, 30_000);

  // -----------------------------------------------------------------------
  // Message handler
  // -----------------------------------------------------------------------

  client.on("message", async (raw: Buffer | ArrayBuffer | Buffer[]) => {
    // Ignore binary messages from client (clients should not send binary)
    if (Buffer.isBuffer(raw) && !isTextMessage(raw)) {
      return;
    }

    const text = raw.toString();
    const message = parseClientMessage(text);

    if (!message) {
      send(client, {
        type: "error",
        message: "Invalid message format",
      });
      return;
    }

    switch (message.type) {
      case "start_session": {
        if (isStreaming) {
          send(client, {
            type: "error",
            message: "Session already streaming",
          });
          return;
        }

        isStreaming = true;

        try {
          // Dynamic imports to avoid circular dependencies
          const { SessionOrchestrator } = await import("@/lib/session");
          const { synthesizeSentence } = await import(
            "@/lib/tts/tts-service"
          );

          const VALID_LENGTHS = [10, 15, 20, 30];
          const sessionLength =
            message.sessionLength &&
              VALID_LENGTHS.includes(message.sessionLength)
              ? message.sessionLength
              : 15;

          const selectedVoiceId = message.voiceId || undefined;

          const orchestrator = new SessionOrchestrator({
            sessionId,
            sessionLengthMinutes: sessionLength,
            mood: message.mood,
            character: message.character as any,
          });

          let previousText = "";
          let sentenceIndex = 0;

          for await (const event of orchestrator.run(controller.signal)) {
            if (controller.signal.aborted) break;

            // Pause gate: wait if paused
            while (isPaused && !controller.signal.aborted) {
              await new Promise<void>((resolve) => {
                resumeResolve = resolve;
              });
            }
            if (controller.signal.aborted) break;

            switch (event.type) {
              case "phase_start":
                send(client, {
                  type: "phase_start",
                  phase: event.phase,
                  phaseIndex: event.phaseIndex,
                });
                break;

              case "sentence":
                // Forward sentence text to client
                send(client, {
                  type: "text",
                  data: event.text,
                  index: event.index,
                });

                // Synthesize sentence to audio and stream to client
                for await (const audioChunk of synthesizeSentence(event.text, {
                  voiceId: selectedVoiceId,
                  previousText: previousText.slice(-1000),
                  signal: controller.signal,
                })) {
                  sendBinary(client, audioChunk);
                }

                // Emit sentence end marker
                send(client, {
                  type: "sentence_end",
                  index: event.index,
                });

                // Track text for TTS prosody context
                previousText += " " + event.text;
                sentenceIndex++;
                break;

              case "phase_transition":
                send(client, {
                  type: "phase_transition",
                  from: event.from,
                  to: event.to,
                });
                break;

              case "session_complete":
                send(client, { type: "session_end" });
                break;

              case "error":
                send(client, {
                  type: "error",
                  message: event.message,
                });
                break;
            }
          }
        } catch (err) {
          // AbortError is expected on clean shutdown
          if (err instanceof Error && err.name !== "AbortError") {
            console.error(`[ws:${sessionId}] Pipeline error:`, err);
            send(client, {
              type: "error",
              message: "Session pipeline error",
            });
          }
        } finally {
          isStreaming = false;
        }
        break;
      }

      case "pause": {
        isPaused = true;
        break;
      }

      case "resume": {
        isPaused = false;
        if (resumeResolve) {
          resumeResolve();
          resumeResolve = null;
        }
        break;
      }

      case "end": {
        controller.abort();
        // Resolve any pending pause Promise so the pipeline loop can exit
        if (resumeResolve) {
          resumeResolve();
          resumeResolve = null;
        }
        send(client, { type: "session_end" });
        client.close(1000, "Session ended by client");
        break;
      }
    }
  });

  // -----------------------------------------------------------------------
  // Close handler
  // -----------------------------------------------------------------------

  client.on("close", () => {
    controller.abort();
    clearInterval(pingInterval);
    // Resolve any pending pause Promise
    if (resumeResolve) {
      resumeResolve();
      resumeResolve = null;
    }
    console.log(`[ws:${sessionId}] Client disconnected`);
  });

  // -----------------------------------------------------------------------
  // Error handler
  // -----------------------------------------------------------------------

  client.on("error", (err) => {
    controller.abort();
    clearInterval(pingInterval);
    // Resolve any pending pause Promise
    if (resumeResolve) {
      resumeResolve();
      resumeResolve = null;
    }
    console.error(`[ws:${sessionId}] WebSocket error:`, err);
  });
}

/**
 * Heuristic to detect if a Buffer looks like a text message.
 * JSON messages start with '{' (0x7B). Binary audio data does not.
 */
function isTextMessage(buf: Buffer): boolean {
  if (buf.length === 0) return false;
  // Check for common JSON start characters
  const first = buf[0];
  return first === 0x7b || first === 0x5b; // '{' or '['
}
