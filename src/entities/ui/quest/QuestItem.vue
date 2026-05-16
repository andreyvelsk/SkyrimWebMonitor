<template>
  <inventory-item
    :name="name"
    :active="active"
    :is-favorite="isQuestActive"
    :class="{ 'quest-item--inactive': disabled }"
    @click="$emit('click')"
  />
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui/items';

defineProps<{
  name: string;
  active?: boolean;
  disabled?: boolean;
  isQuestActive?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
:global(.quest-item--inactive.inv-item--active) {
  background-color: var(--skyrim-bg-light);
  border-color: var(--skyrim-border-dark);
}

:global(.quest-item--inactive .inv-name) {
  color: var(--skyrim-text-muted);
  opacity: 0.2;
}
</style>
