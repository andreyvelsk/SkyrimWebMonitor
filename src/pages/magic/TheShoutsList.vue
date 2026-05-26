<template>
  <inventory-list
    v-model="activeShout"
    :items="shoutsList"
    :empty-message="emptyMessage"
    :actions="[
      {
        group: [
          {
            id: 'favorite',
            event: 'favorite',
            icon: 'delapouite/round-star.svg',
          },
          {
            id: 'hotkey',
            event: 'hotkey',
            icon: 'delapouite/keyboard.svg',
          },
        ],
      },
    ]"
    @item-double-click="equipShout"
    @favorite="toggleFavorite"
    @hotkey="openHotkeyPicker"
  >
    <template #default="{ item, active, onSelect }">
      <shout-item
        v-if="isShoutItem(item)"
        :shout="item"
        :active="active"
        @click="onSelect"
      />
    </template>

    <template #preview>
      <shout-preview
        v-if="activeShoutData"
        :data="activeShoutData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { InventoryList } from '@/features/ui';
import { ShoutItem, ShoutPreview } from '@/entities/ui';
import { useMagicShoutActions } from '@/pages/magic/composables/useMagicShoutActions';
import { isShoutItem } from '@/stores/adapters/typeGuards';
import type { ShoutItem as ShoutItemType } from '@/stores/magic/types';

interface Props {
  shoutsList: ShoutItemType[];
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'Waiting for data...',
});

const {
  activeShout,
  activeShoutData,
  equipShout,
  toggleFavorite,
  openHotkeyPicker,
} = useMagicShoutActions(() => props.shoutsList);
</script>
