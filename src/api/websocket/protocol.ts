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

export interface DescribeMessage extends BaseMessage {
  type: 'describe'
}

export type ClientMessage = SubscribeMessage | UnsubscribeMessage | QueryMessage | DescribeMessage

// ============================================================================
// Server → Client Messages
// ============================================================================

export interface DataMessage extends BaseMessage {
  type: 'data'
  ts: number // Unix timestamp in milliseconds
  fields: Record<string, number> // alias -> float value
}

export interface FieldDescription {
  valueType: string // e.g., "float"
  description: string
}

export interface DescribeResponseMessage extends BaseMessage {
  type: 'describe'
  fields: Record<string, FieldDescription>
}

export interface ErrorMessage extends BaseMessage {
  type: 'error'
  message: string
}

export type ServerMessage = DataMessage | DescribeResponseMessage | ErrorMessage

// ============================================================================
// Field Aliases and Registry Keys
// ============================================================================

/**
 * Map of our internal field names to SkyrimWebSocket registry keys
 * Only includes fields that are actually available in the protocol
 */
export const FIELD_MAPPING: Record<string, string> = {
  health: 'ActorValue::kHealth',
  magicka: 'ActorValue::kMagicka',
  stamina: 'ActorValue::kStamina',
  healthBase: 'ActorValue::kHealth::Base',
  magickaBase: 'ActorValue::kMagicka::Base',
  staminaBase: 'ActorValue::kStamina::Base',
};

/**
 * Create reverse mapping for parsing server responses
 */
export function createReverseFieldMapping(mapping: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(mapping).map(([k, v]) => [v, k]));
}
