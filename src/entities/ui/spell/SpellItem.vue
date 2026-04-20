<template>
  <inventory-item
    :name="spell?.name ?? $t('common.unknown')"
    :is-favorite="spell?.isFavorite"
    :active="active"
    @click="$emit('click')"
  >
    <template
      v-if="spell?.isEquipped"
      #status
    >
      <equipped-hand-icon
        :equipped-hand="spell.equippedHand"
        :size="16"
      />
    </template>
  </inventory-item>
</template>

<script setup lang="ts">
import { InventoryItem } from '@/shared/ui/items';
import { EquippedHandIcon } from '@/features/ui';
import type { SpellItem as SpellItemType } from '@/stores/magic/types';

defineProps<{
  spell?: SpellItemType | null;
  active?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>
