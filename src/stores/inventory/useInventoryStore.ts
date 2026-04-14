import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { WeaponsState, ApparelState } from './types';

export const useInventoryStore = defineStore('inventory', () => {
  // State for inventory/weapons page
  const weapons = ref<WeaponsState>({
    items: undefined,
  });

  // State for inventory/apparel page
  const apparel = ref<ApparelState>({
    items: undefined,
  });

  const weaponsList = computed(() => (weapons.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const apparelList = computed(() => (apparel.value.items || []).sort((a, b) => a.name.localeCompare(b.name)));

  const setWeapons = (newWeapons: WeaponsState) => {
    weapons.value = newWeapons;
  };

  const setApparel = (newApparel: ApparelState) => {
    apparel.value = newApparel;
  };

  return {
    weapons,
    apparel,
    weaponsList,
    apparelList,
    setWeapons,
    setApparel,
  };
});
