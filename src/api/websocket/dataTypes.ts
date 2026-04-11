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
 * Type guard for CharacterStats
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
