<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
  >
    <template #icon>
      <base-icon
        icon-path="lorc/shiny-apple.svg"
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
