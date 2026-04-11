/**
 * WebSocket Protocol Types and Interfaces
 */

// ============================================================================
// Client → Server Messages
// ============================================================================

interface BaseMessage {
  type: string
}

export interface SubscribeMessage extends BaseMessage {
  type: 'subscribe'
  id: string // unique subscription identifier
  settings?: {
    frequency?: number // push interval in milliseconds (min: 50, default: 500)
    sendOnChange?: boolean // only send if values changed (default: false)
  }
  fields: Record<string, string> // alias -> registry key mapping
}

export interface UnsubscribeMessage extends BaseMessage {
  type: 'unsubscribe'
  id?: string // subscription id; if omitted, all subscriptions are cancelled
}

export interface QueryMessage extends BaseMessage {
  type: 'query'
  id: string // unique request identifier
  fields: Record<string, string> // alias -> registry key mapping
}

export interface UnsubscribeAllMessage extends BaseMessage {
  type: 'unsubscribe_all'
}

export interface HeartbeatMessage extends BaseMessage {
  type: 'heartbeat'
}

export interface CommandMessage extends BaseMessage {
  type: 'command'
  id: string
  action: 'equip' | 'unequip' | 'use' | 'drop' | 'favorite'
  formId: string
  hand?: 'right' | 'left'
  count?: number
  favorite?: boolean
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage | UnsubscribeAllMessage | QueryMessage | HeartbeatMessage | CommandMessage

// ============================================================================
// Server → Client Messages
// ============================================================================

export interface DataMessage extends BaseMessage {
  type: 'data'
  id: string // subscription id or query id
  ts: number // Unix timestamp in milliseconds
  fields: Record<string, unknown>
}

export interface HeartbeatResponseMessage extends BaseMessage {
  type: 'heartbeat'
  ts: number // Unix timestamp in milliseconds (server time)
}

export interface ErrorMessage extends BaseMessage {
  type: 'error'
  message: string
}

export interface CommandResultMessage extends BaseMessage {
  type: 'commandResult'
  id: string
  success: boolean
  error?: string
}

export type ServerMessage = DataMessage | HeartbeatResponseMessage | ErrorMessage | CommandResultMessage
