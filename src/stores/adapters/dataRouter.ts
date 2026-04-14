import { useCharacterStore } from '@/stores/character/useCharacterStore';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import type { RouterResult } from './types';
import { isCharacterStatsData, isWeaponsData, isApparelData, isFoodData, isBooksData, isInventoryCategories } from './typeGuards';
import type { CategoriesData } from '@/shared/lib/types/types';
export class DataRouter {
  static routeDataById(subscriptionId: string, data: Record<string, unknown>): RouterResult {
    const characterStore = useCharacterStore();
    const inventoryStore = useInventoryStore();
    try {
      if (isCharacterStatsData(data, subscriptionId)) {
        console.log('[DataRouter] Routing character stats to character store');
        characterStore.setStats(data);
        return { success: true, message: 'Data routed to character store' };
      }

      if (isWeaponsData(data, subscriptionId)) {
        console.log('[DataRouter] Routing weapons data to inventory store');
        inventoryStore.setWeapons(data);
        return { success: true, message: 'Data routed to inventory store (weapons)' };
      }

      if (isApparelData(data, subscriptionId)) {
        console.log('[DataRouter] Routing apparel data to inventory store');
        inventoryStore.setApparel(data);
        return { success: true, message: 'Data routed to inventory store (apparel)' };
      }

      if (isFoodData(data, subscriptionId)) {
        console.log('[DataRouter] Routing food data to inventory store');
        inventoryStore.setFood(data);
        return { success: true, message: 'Data routed to inventory store (food)' };
      }

      if (isBooksData(data, subscriptionId)) {
        console.log('[DataRouter] Routing books data to inventory store');
        inventoryStore.setBooks(data as any);
        return { success: true, message: 'Data routed to inventory store (books)' };
      }

      if (isInventoryCategories(data, subscriptionId)) {
        const navigationStore = useNavigationStore();
        const subTabs = (data as unknown as CategoriesData).categories.map((cat) => ({
          id: cat.categoryId.toLowerCase(),
          label: cat.name,
        }));
        console.log('[DataRouter] Routing categories to navigation store', subTabs);
        navigationStore.setTabSubTabs('inventory', subTabs);
        return { success: true, message: 'Data routed to navigation store (inventory categories)' };
      }

      console.warn('[DataRouter] Unknown subscription ID received:', subscriptionId);
      return { success: false, message: `Unknown subscription ID: ${subscriptionId}` };
    } catch (err) {
      console.error('[DataRouter] Failed to route data by ID:', err);
      return {
        success: false,
        message: 'Failed to route data',
        error: err instanceof Error ? err : new Error(String(err)),
      };
    }
  }
}

