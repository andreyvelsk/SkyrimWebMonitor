import type { ComputedRef } from 'vue';

export interface CharacterStatsDisplay {
  displayLevel: ComputedRef<string>;
  displayExperience: ComputedRef<string>;
  displayCarryWeight: ComputedRef<string>;
  displayGold: ComputedRef<string>;
  healthPercentage: ComputedRef<number>;
  magickaPercentage: ComputedRef<number>;
  staminaPercentage: ComputedRef<number>;
}
