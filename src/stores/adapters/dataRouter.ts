import { useCharacterStore } from '@/stores/character/useCharacterStore';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import type { RouterResult } from './types';
import { isCharacterStatsData, isWeaponsData, isApparelData, isFoodData, isPotionsData, isScrollsData, isKeysData, isBooksData, isInventoryCategories, isIngredientsData, isMiscData, isMagicCategoriesData, isDestructionData, isAlterationData, isConjurationData, isIllusionData, isRestorationData, isEnchantingData } from './typeGuards';
export class DataRouter {
  static routeDataById(subscriptionId: string, data: unknown): RouterResult {
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

      if (isPotionsData(data, subscriptionId)) {
        console.log('[DataRouter] Routing potions data to inventory store');
        inventoryStore.setPotions(data);
        return { success: true, message: 'Data routed to inventory store (potions)' };
      }

      if (isIngredientsData(data, subscriptionId)) {
        console.log('[DataRouter] Routing ingredients data to inventory store');
        inventoryStore.setIngredients(data);
        return { success: true, message: 'Data routed to inventory store (ingredients)' };
      }

      if (isScrollsData(data, subscriptionId)) {
        console.log('[DataRouter] Routing scrolls data to inventory store');
        inventoryStore.setScrolls(data);
        return { success: true, message: 'Data routed to inventory store (scrolls)' };
      }

      if (isKeysData(data, subscriptionId)) {
        console.log('[DataRouter] Routing keys data to inventory store');
        inventoryStore.setKeys(data);
        return { success: true, message: 'Data routed to inventory store (keys)' };
      }

      if (isBooksData(data, subscriptionId)) {
        console.log('[DataRouter] Routing books data to inventory store');
        inventoryStore.setBooks(data);
        return { success: true, message: 'Data routed to inventory store (books)' };
      }

      if (isMiscData(data, subscriptionId)) {
        console.log('[DataRouter] Routing misc data to inventory store');
        inventoryStore.setMisc(data);
        return { success: true, message: 'Data routed to inventory store (misc)' };
      }

      if (isInventoryCategories(data, subscriptionId)) {
        const navigationStore = useNavigationStore();
        const subTabs = (data.categories || []).map((cat) => ({
          id: cat.categoryId.toLowerCase(),
          label: cat.name,
        }));

        // Order subTabs according to navigation store ordering map (if present),
        // using the same logic as `currentSubTabs` (ordered by map, then append rest).
        const order = (navigationStore.subTabsOrderMap as any)?.inventory ?? (navigationStore.subTabsOrderMap as any)?.value?.inventory ?? [];
        const ordered: typeof subTabs = [];
        const remaining = [...subTabs];

        if (Array.isArray(order) && order.length) {
          order.forEach((id: string) => {
            const idx = remaining.findIndex((s) => s.id === id);
            if (idx === -1) return;
            const [sub] = remaining.splice(idx, 1);
            ordered.push(sub);
          });
        }

        if (remaining.length) ordered.push(...remaining);

        console.log('[DataRouter] Routing categories to navigation store', ordered);
        navigationStore.setTabSubTabs('inventory', ordered);
        return { success: true, message: 'Data routed to navigation store (inventory categories)' };
      }

      if (isMagicCategoriesData(data, subscriptionId)) {
        const navigationStore = useNavigationStore();
        const magicStore = useMagicStore();
        magicStore.setCategories(data.categories ?? undefined);
        const subTabs = (data.categories || []).map((cat) => ({
          id: cat.categoryId.toLowerCase(),
          label: cat.name,
        }));

        const order = (navigationStore.subTabsOrderMap as any)?.magic ?? (navigationStore.subTabsOrderMap as any)?.value?.magic ?? [];
        const ordered: typeof subTabs = [];
        const remaining = [...subTabs];

        if (Array.isArray(order) && order.length) {
          order.forEach((id: string) => {
            const idx = remaining.findIndex((s) => s.id === id);
            if (idx === -1) return;
            const [sub] = remaining.splice(idx, 1);
            ordered.push(sub);
          });
        }

        if (remaining.length) ordered.push(...remaining);

        console.log('[DataRouter] Routing magic categories to navigation store', ordered);
        navigationStore.setTabSubTabs('magic', ordered);
        return { success: true, message: 'Data routed to navigation store (magic categories)' };
      }

      if (isDestructionData(data, subscriptionId)) {
        console.log('[DataRouter] Routing destruction spells to magic store');
        useMagicStore().setDestruction(data);
        return { success: true, message: 'Data routed to magic store (destruction)' };
      }

      if (isAlterationData(data, subscriptionId)) {
        console.log('[DataRouter] Routing alteration spells to magic store');
        useMagicStore().setAlteration(data);
        return { success: true, message: 'Data routed to magic store (alteration)' };
      }

      if (isConjurationData(data, subscriptionId)) {
        console.log('[DataRouter] Routing conjuration spells to magic store');
        useMagicStore().setConjuration(data);
        return { success: true, message: 'Data routed to magic store (conjuration)' };
      }

      if (isIllusionData(data, subscriptionId)) {
        console.log('[DataRouter] Routing illusion spells to magic store');
        useMagicStore().setIllusion(data);
        return { success: true, message: 'Data routed to magic store (illusion)' };
      }

      if (isRestorationData(data, subscriptionId)) {
        console.log('[DataRouter] Routing restoration spells to magic store');
        useMagicStore().setRestoration(data);
        return { success: true, message: 'Data routed to magic store (restoration)' };
      }

      if (isEnchantingData(data, subscriptionId)) {
        console.log('[DataRouter] Routing enchanting spells to magic store');
        useMagicStore().setEnchanting(data);
        return { success: true, message: 'Data routed to magic store (enchanting)' };
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

