<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
  >
    <template #icon>
      <base-icon
        icon-path="skoll/pestle-mortar.svg"
      />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { BaseIcon } from '@/shared/ui';
import { InventoryItem } from '@/shared/ui/items';
import type { ItemEnchantmentEffect } from '@/stores/inventory/types';

defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
  effects?: ItemEnchantmentEffect[];
  active?: boolean;
}>();
</script>

<style scoped lang="scss">
// Component uses InventoryItem styles
</style>
