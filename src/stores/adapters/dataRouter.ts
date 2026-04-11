/**
 * Data Router Adapter
 *
 * Routes incoming WebSocket data to appropriate domain stores based on data type.
 * Can route using subscription ID (preferred) or by analyzing data with type guards.
 */

import { useCharacterStore } from '@/stores/character/useCharacterStore';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import type { PageData } from '@/api/websocket/dataTypes';
import {
  isCharacterStats,
  isWeaponsData,
  isApparelData,
  isCharacterStatsId,
  isWeaponsDataId,
  isApparelDataId,
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
   * Route incoming data to appropriate store based on subscription ID
   * This is the preferred method as it uses the subscription ID for type determination
   *
   * @param subscriptionId - Subscription ID from server response (e.g., 'character.stats')
   * @param data - Typed data: CharacterStats | WeaponsState | ApparelState
   * @returns Router result with success status
   */
  static routeDataById(subscriptionId: string, data: PageData): RouterResult {
    const characterStore = useCharacterStore();
    const inventoryStore = useInventoryStore();
    try {
      // Route based on subscription ID and data structure verification
      if (isCharacterStatsId(data, subscriptionId)) {
        console.log('[DataRouter] Routing character stats [character.stats] to character store');
        characterStore.setStats(data);
        return {
          success: true,
          message: 'Data routed to character store',
        };
      }

      if (isWeaponsDataId(data, subscriptionId)) {
        console.log('[DataRouter] Routing weapons data [inventory.weapons] to inventory store');
        inventoryStore.setWeapons(data);
        return {
          success: true,
          message: 'Data routed to inventory store (weapons)',
        };
      }

      if (isApparelDataId(data, subscriptionId)) {
        console.log('[DataRouter] Routing apparel data [inventory.apparel] to inventory store');
        inventoryStore.setApparel(data);
        return {
          success: true,
          message: 'Data routed to inventory store (apparel)',
        };
      }

      // No matching subscription ID found
      console.warn('[DataRouter] Unknown subscription ID received:', subscriptionId);
      return {
        success: false,
        message: `Unknown subscription ID: ${subscriptionId}`,
      };
    } catch (err) {
      console.error('[DataRouter] Failed to route data by ID:', err);
      return {
        success: false,
        message: 'Failed to route data',
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }

  /**
   * Route incoming data to appropriate store based on data type (fallback)
   * Uses type guards to determine data type when subscription ID is not available
   *
   * @param data - Typed data: CharacterStats | WeaponsState | ApparelState
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
        console.log('[DataRouter] Routing character stats to character store (fallback)');
        characterStore.setStats(data);
        return {
          success: true,
          message: 'Data routed to character store',
        };
      }

      if (isWeaponsData(data)) {
        console.log('[DataRouter] Routing weapons data to inventory store (fallback)');
        inventoryStore.setWeapons(data);
        return {
          success: true,
          message: 'Data routed to inventory store (weapons)',
        };
      }

      if (isApparelData(data)) {
        console.log('[DataRouter] Routing apparel data to inventory store (fallback)');
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
