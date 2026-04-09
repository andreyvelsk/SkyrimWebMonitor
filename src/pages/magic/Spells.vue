<template>
  <div class="list">
    <magic-item
      name="Fireball"
      school="Destruction"
      :cost="50"
    />
    <magic-item
      name="Healing Hands"
      school="Restoration"
      :cost="25"
    />
    <magic-item
      name="Oakflesh"
      school="Alteration"
      :cost="40"
    />
    <magic-item
      name="Conjure Flame Atronach"
      school="Conjuration"
      :cost="100"
    />
  </div>
</template>

<script setup lang="ts">
import { MagicItem } from '@/shared/ui';
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
