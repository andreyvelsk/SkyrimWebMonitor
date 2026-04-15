<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
  >
    <template #icon>
      <base-icon icon-path="lorc/swap-bag.svg" />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { BaseIcon } from '@/shared/ui';
import { InventoryItem } from '@/shared/ui/items';

defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
  active?: boolean;
  capacity?: string;
  containedSoul?: string;
}>();
</script>

<style scoped lang="scss">
.inv-desc {
  color: var(--skyrim-text-secondary);
  font-size: 0.85rem;
}
</style>
