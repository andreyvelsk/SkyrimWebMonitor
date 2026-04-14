<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template #icon>
      <base-icon icon-path="lorc/open-book.svg" />
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
  description?: string;
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
/* Uses inventory list styles */
</style>
