/**
 * Data type guards and types for WebSocket messages
 * Used to determine which store to route data to
 */

import type { CharacterStats } from '@/stores/character/types';
import type { WeaponsState, ApparelState } from '@/stores/inventory/types';
import { getPageFields } from '@/shared/lib/config/pageRegistry';

export type { CharacterStats } from '@/stores/character/types';
export type { WeaponsState, ApparelState } from '@/stores/inventory/types';

export type PageData = CharacterStats | WeaponsState | ApparelState;

/**
 * Type guard for CharacterStats with ID verification
 * Checks both subscription ID and data structure
 */
export function isCharacterStatsId(data: unknown, id: string): data is CharacterStats {
  if (id !== 'character.stats') return false;
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;
  const characterFields = Object.keys(getPageFields('character', 'stats'));

  return Object.keys(record).some((key) => characterFields.includes(key));
}

/**
 * Type guard for WeaponsState with ID verification
 * Checks both subscription ID and data structure
 */
export function isWeaponsDataId(data: unknown, id: string): data is WeaponsState {
  if (id !== 'inventory.weapons') return false;
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;
  return ('categories' in record || 'items' in record) &&
    !isCharacterStatsId(data, 'character.stats') &&
    !isApparelDataId(data, 'inventory.apparel');
}

/**
 * Type guard for ApparelState with ID verification
 * Checks both subscription ID and data structure
 */
export function isApparelDataId(data: unknown, id: string): data is ApparelState {
  if (id !== 'inventory.apparel') return false;
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;
  return 'categories' in record || 'items' in record;
}

/**
 * Type guard for CharacterStats (fallback without ID verification)
 * Checks if data contains any character-specific fields
 */
export function isCharacterStats(data: unknown): data is CharacterStats {
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;
  const characterFields = Object.keys(getPageFields('character', 'stats'));

  return Object.keys(record).some((key) => characterFields.includes(key));
}

/**
 * Type guard for WeaponsState
 * Checks if data appears to be weapon inventory data
 */
export function isWeaponsData(data: unknown): data is WeaponsState {
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;

  return (
    ('categories' in record || 'items' in record) &&
    !isCharacterStats(data) &&
    !isApparelData(data)
  );
}

/**
 * Type guard for ApparelState
 * Checks if data appears to be apparel inventory data
 */
export function isApparelData(data: unknown): data is ApparelState {
  if (typeof data !== 'object' || data === null) return false;

  const record = data as Record<string, unknown>;

  return 'categories' in record || 'items' in record;
}
