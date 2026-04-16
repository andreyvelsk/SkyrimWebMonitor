<template>
  <inventory-item
    :name="name"
    :quantity="quantity"
    :is-favorite="isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template #status>
      <equip-status
        :is-equipped="isEquipped"
        :centered="true"
      />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem, EquipStatus } from '@/shared/ui/items';

defineProps<{
  name: string;
  quantity?: number;
  isFavorite?: boolean;
  isEquipped?: boolean;
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>

