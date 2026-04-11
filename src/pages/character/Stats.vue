<template>
  <div class="flex flex-1 flex-col justify-between">
    <div class="list">
      <attribute-row
        label="Level"
        :value="displayLevel"
      />
      <attribute-row
        label="Experience"
        :value="displayExperience"
      />
      <attribute-row
        label="Carry Weight"
        :value="displayCarryWeight"
      />
      <attribute-row
        label="Gold"
        :value="displayGold"
      />
    </div>
    <div class="stats-grid">
      <stat-bar
        :value="healthPercentage"
        :max="100"
        color="health"
      />
      <stat-bar
        :value="magickaPercentage"
        :max="100"
        color="magicka"
      />
      <stat-bar
        :value="staminaPercentage"
        :max="100"
        color="stamina"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { StatBar, AttributeRow } from '@/shared/ui';
import { useCharacterStatsDisplay } from './composables/useCharacterStatsDisplay';

const {
  displayLevel,
  displayExperience,
  displayCarryWeight,
  displayGold,
  healthPercentage,
  magickaPercentage,
  staminaPercentage,
} = useCharacterStatsDisplay();
</script>

<style scoped lang="scss">
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
