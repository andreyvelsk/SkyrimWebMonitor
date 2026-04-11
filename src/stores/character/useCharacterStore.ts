import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { CharacterStats } from './types';

export const useCharacterStore = defineStore('character', () => {
  // State for character/stats page
  const stats = ref<CharacterStats>({
    health: undefined,
    magicka: undefined,
    stamina: undefined,
    healthBase: undefined,
    magickaBase: undefined,
    staminaBase: undefined,
    level: undefined,
    xp: undefined,
    xpNext: undefined,
    inventoryWeight: undefined,
    carryWeight: undefined,
    gold: undefined,
  });

  /**
   * Calculate percentage value
   */
  const getPercentage = (value: number | null | undefined, maxValue: number | null | undefined): number => {
    if (!value || !maxValue || maxValue === 0) return 0;
    return (value / maxValue) * 100;
  };

  /**
   * Computed percentages for stats
   */
  const statsPercentage = computed(() => ({
    health: getPercentage(stats.value.health, stats.value.healthBase),
    magicka: getPercentage(stats.value.magicka, stats.value.magickaBase),
    stamina: getPercentage(stats.value.stamina, stats.value.staminaBase),
  }));

  /**
   * Computed XP progress
   */
  const xpProgress = computed(() => {
    const xp = stats.value.xp;
    const xpNext = stats.value.xpNext;
    
    if (xp === undefined || xp === null || xpNext === undefined || xpNext === null || xpNext === 0) {
      return 0;
    }
    return (xp / xpNext) * 100;
  });

  /**
   * Update character stats
   */
  const setStats = (newStats: Partial<CharacterStats>) => {
    stats.value = { ...stats.value, ...newStats };
  };

  return {
    stats,
    statsPercentage,
    xpProgress,
    setStats,
  };
});
