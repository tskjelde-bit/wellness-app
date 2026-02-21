/**
 * WebSocket message protocol for real-time session communication.
 *
 * Uses discriminated unions for type-safe message routing.
 * Binary audio frames are sent as raw Uint8Array without JSON wrapping --
 * they are distinguished from JSON text frames by their binary opcode.
 */

// ---------------------------------------------------------------------------
// Server -> Client messages
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: "session_start"; sessionId: string }
  | { type: "text"; data: string; index: number }
  | { type: "sentence_end"; index: number }
  | { type: "phase_start"; phase: string; phaseIndex: number }
  | { type: "phase_transition"; from: string; to: string }
  | { type: "session_end" }
  | { type: "error"; message: string };

// ---------------------------------------------------------------------------
// Client -> Server messages
// ---------------------------------------------------------------------------

export type ClientMessage =
  | { type: "start_session"; prompt?: string; sessionLength?: number }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "end" };

// ---------------------------------------------------------------------------
// Valid message type constants (for runtime validation)
// ---------------------------------------------------------------------------

const VALID_CLIENT_TYPES = new Set<string>([
  "start_session",
  "pause",
  "resume",
  "end",
]);

// ---------------------------------------------------------------------------
// Parsing and serialization
// ---------------------------------------------------------------------------

/**
 * Safely parse a raw WebSocket message string into a ClientMessage.
 *
 * Returns null if the message is not valid JSON, not an object,
 * or has an unknown message type.
 */
export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const obj = parsed as Record<string, unknown>;

    if (typeof obj.type !== "string" || !VALID_CLIENT_TYPES.has(obj.type)) {
      return null;
    }

    // Type-specific validation
    switch (obj.type) {
      case "start_session": {
        const sessionLength =
          typeof obj.sessionLength === "number"
            ? obj.sessionLength
            : undefined;
        return {
          type: "start_session",
          prompt: typeof obj.prompt === "string" ? obj.prompt : undefined,
          sessionLength,
        };
      }
      case "pause":
        return { type: "pause" };
      case "resume":
        return { type: "resume" };
      case "end":
        return { type: "end" };
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Serialize a ServerMessage to a JSON string for WebSocket transmission.
 */
export function serializeServerMessage(message: ServerMessage): string {
  return JSON.stringify(message);
}
