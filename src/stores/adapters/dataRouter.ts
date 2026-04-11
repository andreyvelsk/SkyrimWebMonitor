/**
 * Data Router Adapter
 *
 * Routes incoming WebSocket data to appropriate domain stores based on data type.
 * Uses type guards to automatically determine data type and destination store.
 */

import { useCharacterStore } from '@/stores/character/useCharacterStore';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import type { PageData } from '@/api/websocket/dataTypes';
import {
  isCharacterStats,
  isWeaponsData,
  isApparelData,
} from '@/api/websocket/dataTypes';

/**
 * Router result type
 */
export interface RouterResult {
  success: boolean;
  message: string;
  error?: Error;
}

/**
 * Data Router class
 * Handles routing of incoming data to appropriate stores
 */
export class DataRouter {
  /**
   * Route incoming data to appropriate store based on data type
   *
   * @param data - Typed data: CharacterStats | WeaponsState | ApparelState
   * @param characterStore - Character store instance
   * @param inventoryStore - Inventory store instance
   * @returns Router result with success status
   */
  static routeData(
    data: PageData,
  ): RouterResult {
    const characterStore = useCharacterStore();
    const inventoryStore = useInventoryStore();
    try {
      // Use type guards to determine data type
      if (isCharacterStats(data)) {
        console.log('[DataRouter] Routing character stats to character store');
        characterStore.setStats(data);
        return {
          success: true,
          message: 'Data routed to character store',
        };
      }

      if (isWeaponsData(data)) {
        console.log('[DataRouter] Routing weapons data to inventory store');
        inventoryStore.setWeapons(data);
        return {
          success: true,
          message: 'Data routed to inventory store (weapons)',
        };
      }

      if (isApparelData(data)) {
        console.log('[DataRouter] Routing apparel data to inventory store');
        inventoryStore.setApparel(data);
        return {
          success: true,
          message: 'Data routed to inventory store (apparel)',
        };
      }

      // No matching type found
      console.warn('[DataRouter] Unknown data type received:', data);
      return {
        success: false,
        message: `Unknown data type: ${JSON.stringify(data)}`,
      };
    } catch (err) {
      console.error('[DataRouter] Failed to route data:', err);
      return {
        success: false,
        message: 'Failed to route data',
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}
