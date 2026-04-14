import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useCharacterStore } from '@/stores/character/useCharacterStore';
import type { CharacterStatsDisplay } from './types';

/**
 * Use character stats display
 *
 * Computes all display values for the character stats page
 * @returns Display values ready for rendering
 */
export function useCharacterStatsDisplay(): CharacterStatsDisplay {
  const characterStore = useCharacterStore();
  const { stats, statsPercentage } = storeToRefs(characterStore);

  /**
   * Format level for display
   */
  const displayLevel = computed(() => {
    const level = stats.value.level;
    return level ? String(level) : '-';
  });

  /**
   * Format experience for display (current / next)
   */
  const displayExperience = computed(() => {
    const xp = stats.value.xp;
    const xpNext = stats.value.xpNext;

    if (xp !== null && xp !== undefined && xpNext !== null && xpNext !== undefined) {
      return `${String(xp)} / ${String(xpNext)}`;
    }
    return '-';
  });

  /**
   * Format carry weight for display (current / max)
   */
  const displayCarryWeight = computed(() => {
    const inventoryWeight = stats.value.inventoryWeight;
    const carryWeight = stats.value.carryWeight;

    if (
      inventoryWeight !== null &&
      inventoryWeight !== undefined &&
      carryWeight !== null &&
      carryWeight !== undefined
    ) {
      return `${String(Math.round(inventoryWeight))} / ${String(Math.round(carryWeight))}`;
    }
    return '-';
  });

  /**
   * Format gold for display
   */
  const displayGold = computed(() => {
    const gold = stats.value.gold;
    return gold ? String(gold) : '-';
  });

  /**
   * Get health percentage for display
   */
  const healthPercentage = computed(() => statsPercentage.value.health);

  /**
   * Get magicka percentage for display
   */
  const magickaPercentage = computed(() => statsPercentage.value.magicka);

  /**
   * Get stamina percentage for display
   */
  const staminaPercentage = computed(() => statsPercentage.value.stamina);

  return {
    displayLevel,
    displayExperience,
    displayCarryWeight,
    displayGold,
    healthPercentage,
    magickaPercentage,
    staminaPercentage,
  };
}
