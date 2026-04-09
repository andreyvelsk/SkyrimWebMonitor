<template>
  <div class="stats-grid">
    <stat-bar
      label="Health"
      :value="85"
      :max="100"
      color="health"
    />
    <stat-bar
      label="Magicka"
      :value="60"
      :max="100"
      color="magicka"
    />
    <stat-bar
      label="Stamina"
      :value="72"
      :max="100"
      color="stamina"
    />
  </div>
  <div class="list">
    <attribute-row
      label="Level"
      value="24"
    />
    <attribute-row
      label="Experience"
      value="1,250 / 2,000"
    />
    <attribute-row
      label="Carry Weight"
      value="285 / 300"
    />
    <attribute-row
      label="Gold"
      value="4,567"
    />
  </div>
</template>

<script setup lang="ts">
import { StatBar, AttributeRow } from '@/shared/ui';
</script>

<style scoped>
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
