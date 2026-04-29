import type {
  EquippedHand,
} from '@/shared/lib/types/common';

/**
 * WebSocket Protocol Types and Interfaces
 * Based on: https://github.com/andreyvelsk/SkyrimWebSocket/blob/main/PROTOCOL.md
 */

// ============================================================================
// Shared Types
// ============================================================================

export type CommandType =
  | 'equip'
  | 'unequip'
  | 'use'
  | 'drop'
  | 'favorite'
  | 'equip_spell'
  | 'unequip_spell'
  | 'favorite_spell'
  | 'hotkey_set'
  | 'hotkey_clear'
  | 'hotkey_trigger'
  | 'player_marker_set'
  | 'player_marker_clear'
  | 'fast_travel'
export type EquipHand = EquippedHand
export type HotkeySlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

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
 * - favorite_spell: Toggles the spell's favorite status on/off.
 * - hotkey_set: Binds a formId to a hotkey slot (1..8). Requires formId and slot.
 * - hotkey_clear: Removes the binding on a slot (1..8). Requires slot.
 * - hotkey_trigger: Fires the action bound to a slot (1..8). Requires slot.
 * - player_marker_set: Places/moves the player's custom map marker. Requires x, y; z optional.
 * - player_marker_clear: Hides the player's custom map marker. Takes no parameters.
 * - fast_travel: Teleports the player to a discovered map marker. Requires formId
 *                (use the `refId` returned by `Map::Markers`).
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
  command: CommandType
  /** Hex form ID. Required by equip/unequip/use/drop/favorite/*_spell, hotkey_set, fast_travel. */
  formId?: string
  /** Equip/unequip hand: "right" or "left" (weapons & spells only, default: "right"). */
  hand?: EquipHand
  /** Drop count (default: 1, only used by `drop`). */
  count?: number
  /** Hotkey slot 1..8 (required for hotkey_set / hotkey_clear / hotkey_trigger). */
  slot?: HotkeySlot
  /** World X coordinate (required for `player_marker_set`). */
  x?: number
  /** World Y coordinate (required for `player_marker_set`). */
  y?: number
  /** World Z coordinate (optional for `player_marker_set`, default: 0). */
  z?: number
}

/**
 * Options accepted by `sendCommand` / `wsClient.command`.
 * Use this object form instead of positional parameters so calls like
 *   sendCommand({ command: 'hotkey_clear', slot: 1 })
 * stay readable without trailing `undefined` arguments.
 *
 * Per-command required fields:
 *   - equip / unequip:                formId (+ optional hand)
 *   - use / favorite / favorite_spell: formId
 *   - drop:                            formId (+ optional count)
 *   - equip_spell / unequip_spell:    formId (+ optional hand)
 *   - hotkey_set:                      formId, slot
 *   - hotkey_clear / hotkey_trigger:  slot
 *   - player_marker_set:               x, y (+ optional z)
 *   - player_marker_clear:             (no fields)
 *   - fast_travel:                     formId (refId of map marker)
 */
export interface SendCommandOptions {
  command: CommandType
  formId?: string
  hand?: EquipHand
  count?: number
  slot?: HotkeySlot
  x?: number
  y?: number
  z?: number
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
