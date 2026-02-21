/**
 * WebSocket module barrel exports.
 *
 * Re-exports message types, parsing utilities, and session handler
 * for convenient imports via @/lib/ws.
 */

// Message protocol
export {
  type ServerMessage,
  type ClientMessage,
  parseClientMessage,
  serializeServerMessage,
} from "./message-types";
