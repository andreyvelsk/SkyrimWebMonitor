import type {
  SubscribeMessage,
  UnsubscribeMessage,
  UnsubscribeAllMessage,
  QueryMessage,
  HeartbeatMessage,
  CommandMessage,
  SendCommandOptions,
  ClientMessage,
  ServerMessage,
  DataMessage,
  HeartbeatResponseMessage,
  ErrorMessage,
  CommandResultMessage,
} from './lib/types';

/**
 * WebSocket Protocol helpers.
 *
 * All type definitions have been moved to `./lib/types.ts`.
 * This file re-exports them for backwards compatibility and provides
 * protocol-level helper functions.
 */

export type {
  SubscribeMessage,
  UnsubscribeMessage,
  UnsubscribeAllMessage,
  QueryMessage,
  HeartbeatMessage,
  CommandMessage,
  SendCommandOptions,
  ClientMessage,
  ServerMessage,
  DataMessage,
  HeartbeatResponseMessage,
  ErrorMessage,
  CommandResultMessage,
};
