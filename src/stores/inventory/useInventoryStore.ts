import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { WeaponsState, ApparelState } from './types';

export const useInventoryStore = defineStore('inventory', () => {
  // State for inventory/weapons page
  const weapons = ref<WeaponsState>({
    categories: undefined,
    items: undefined,
  });

  // State for inventory/apparel page
  const apparel = ref<ApparelState>({
    categories: undefined,
    items: undefined,
  });

  /**
   * Group items by category
   */
  const groupItemsByCategory = (items: any[] | null | undefined, categories: string[] | null | undefined): Record<string, any[]> => {
    if (!items || !categories) return {};

    const grouped: Record<string, any[]> = {};
    categories.forEach((category) => {
      grouped[category] = items.filter((item) => item.category === category);
    });
    return grouped;
  };

  /**
   * Computed weapons grouped by category
   */
  const weaponsByCategory = computed(() =>
    groupItemsByCategory(weapons.value.items, weapons.value.categories)
  );

  /**
   * Computed apparel grouped by category
   */
  const apparelByCategory = computed(() =>
    groupItemsByCategory(apparel.value.items, apparel.value.categories)
  );

  /**
   * Update weapons state
   * Accepts partial weapons data to merge with existing state
   */
  const setWeapons = (newWeapons: Partial<WeaponsState>) => {
    weapons.value = { ...weapons.value, ...newWeapons };
  };

  /**
   * Update apparel state
   * Accepts partial apparel data to merge with existing state
   */
  const setApparel = (newApparel: Partial<ApparelState>) => {
    apparel.value = { ...apparel.value, ...newApparel };
  };

  /**
   * Reset weapons to initial state
   */
  const resetWeapons = () => {
    weapons.value = {
      categories: undefined,
      items: undefined,
    };
  };

  /**
   * Reset apparel to initial state
   */
  const resetApparel = () => {
    apparel.value = {
      categories: undefined,
      items: undefined,
    };
  };

  /**
   * Reset all inventory data
   */
  const resetInventory = () => {
    resetWeapons();
    resetApparel();
  };

  return {
    weapons,
    apparel,
    weaponsByCategory,
    apparelByCategory,
    setWeapons,
    setApparel,
    resetWeapons,
    resetApparel,
    resetInventory,
  };
});
