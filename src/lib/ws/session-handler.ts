/**
 * WebSocket session lifecycle manager.
 *
 * Handles the full lifecycle of a streaming audio session:
 * - Connection setup with session ID assignment
 * - Start session: triggers cascading audio pipeline (LLM -> TTS -> audio)
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

/**
 * AudioChunkEvent mirrors the type from @/lib/tts/audio-pipeline.
 * Defined here to avoid compile-time dependency on a module that may
 * not yet exist (04-01 builds the TTS pipeline).
 */
type AudioChunkEvent =
  | { type: "sentence_start"; text: string; index: number }
  | { type: "audio"; data: Uint8Array }
  | { type: "sentence_end"; index: number }
  | { type: "session_end" };

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
          // Dynamic import to avoid circular dependencies and allow
          // the TTS module to be built independently (04-01 plan).
          // Uses unknown intermediate cast because the TTS module may
          // not yet export streamSessionAudio until 04-01 completes.
          const tts = (await import("@/lib/tts")) as unknown as {
            streamSessionAudio: (
              prompt: string,
              options?: { signal?: AbortSignal },
            ) => AsyncGenerator<AudioChunkEvent>;
          };
          const { streamSessionAudio } = tts;

          const pipeline = streamSessionAudio(
            message.prompt ?? "",
            { signal: controller.signal },
          );

          for await (const event of pipeline) {
            // Check abort before processing each event
            if (controller.signal.aborted) break;

            // Pause gate: wait if paused
            while (isPaused && !controller.signal.aborted) {
              await new Promise<void>((resolve) => {
                resumeResolve = resolve;
              });
            }

            if (controller.signal.aborted) break;

            switch (event.type) {
              case "sentence_start":
                send(client, {
                  type: "text",
                  data: event.text,
                  index: event.index,
                });
                break;

              case "audio":
                sendBinary(client, event.data);
                break;

              case "sentence_end":
                send(client, {
                  type: "sentence_end",
                  index: event.index,
                });
                break;

              case "session_end":
                send(client, { type: "session_end" });
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
