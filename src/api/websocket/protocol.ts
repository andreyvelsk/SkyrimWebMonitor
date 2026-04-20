/**
 * WebSocket Protocol Types and Interfaces
 * Based on: https://github.com/andreyvelsk/SkyrimWebSocket/blob/main/PROTOCOL.md
 */

// ============================================================================
// Shared Types
// ============================================================================

export type CommandType = 'equip' | 'unequip' | 'use' | 'drop' | 'favorite' | 'equip_spell' | 'unequip_spell' | 'favorite_spell'
export type EquipHand = 'right' | 'left'

/**
 * Command Details:
 * - equip: Equips the item. Weapons use the hand parameter to select left/right hand.
 *          Apparel and ammo auto-select the correct slot.
 * - unequip: Removes the equipped item. For weapons, hand specifies which hand to unequip from.
 * - use: Consumes the item (applies effect). Scrolls are equipped for casting.
 * - drop: Drops count items from inventory onto the ground. Use count parameter to specify quantity.
 * - favorite: Toggles the item's favorite status on/off.
 * - equip_spell: Equips a spell to a hand for casting. Uses hand parameter (right/left).
 * - unequip_spell: Unequips a spell from a hand. Uses hand parameter (right/left).
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
  id: string // unique request identifier
  command: CommandType // equip | unequip | use | drop | favorite
  formId: string // item form ID as hex string (e.g. "0x00012EB7")
  hand?: EquipHand // equip/unequip hand: "right" or "left" (optional, weapons only, default: "right")
  count?: number // drop count (optional, default: 1, only used by "drop")
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
