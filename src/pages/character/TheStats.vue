<template>
  <div class="stats-layout">
    <div class="list">
      <attribute-row
        :label="$t('pages.character.stats.level')"
        :value="displayLevel"
      />
      <attribute-row
        :label="$t('pages.character.stats.experience')"
        :value="displayExperience"
      />
      <attribute-row
        :label="$t('pages.character.stats.carryWeight')"
        :value="displayCarryWeight"
      />
      <attribute-row
        :label="$t('pages.character.stats.gold')"
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
.stats-layout {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
</style>
