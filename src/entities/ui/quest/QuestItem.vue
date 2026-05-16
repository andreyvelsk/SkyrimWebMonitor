<template>
  <inventory-item
    :name="name"
    :active="active"
    :class="{ 'quest-item--inactive': disabled }"
    @click="$emit('click')"
  >
    <template #status>
      <quest-step-indicator
        v-if="isQuestActive"
        :completed="true"
        :failed="false"
      />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui/items';
import QuestStepIndicator from './QuestStepIndicator.vue';

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
