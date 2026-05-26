<template>
  <inventory-item
    :name="shout?.name ?? $t('common.unknown')"
    :is-favorite="shout?.isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template
      v-if="shout?.isEquipped"
      #status
    >
      <equip-status :is-equipped="true" />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem, EquipStatus } from '@/shared/ui/items';
import type { ShoutItem as ShoutItemType } from '@/stores/magic/types';

defineProps<{
  shout?: ShoutItemType | null;
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>
