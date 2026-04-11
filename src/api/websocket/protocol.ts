/**
 * WebSocket Protocol Types and Interfaces
 */

import type { PageData } from './dataTypes';

// ============================================================================
// Client → Server Messages
// ============================================================================

interface BaseMessage {
  type: string
}

export interface SubscribeMessage extends BaseMessage {
  type: 'subscribe'
  settings?: {
    frequency?: number // push interval in milliseconds (min: 50, default: 500)
    sendOnChange?: boolean // only send if values changed (default: false)
  }
  fields: Record<string, string> // alias -> registry key mapping
}

export interface UnsubscribeMessage extends BaseMessage {
  type: 'unsubscribe'
}

export interface QueryMessage extends BaseMessage {
  type: 'query'
  fields: Record<string, string> // alias -> registry key mapping
}

export interface HeartbeatMessage extends BaseMessage {
  type: 'heartbeat'
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage | QueryMessage | HeartbeatMessage

// ============================================================================
// Server → Client Messages
// ============================================================================

export interface DataMessage extends BaseMessage {
  type: 'data'
  ts: number // Unix timestamp in milliseconds
  fields: PageData // Typed fields: CharacterStats | WeaponsInventoryData | ApparelInventoryData
}

export interface HeartbeatResponseMessage extends BaseMessage {
  type: 'heartbeat'
  ts: number // Unix timestamp in milliseconds (server time)
}

export interface ErrorMessage extends BaseMessage {
  type: 'error'
  message: string
}

export type ServerMessage = DataMessage | HeartbeatResponseMessage | ErrorMessage
