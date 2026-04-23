<template>
  <inventory-list
    v-model="activeSpell"
    :items="spellsList"
    :empty-message="emptyMessage"
    :actions="[
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
    ]"
    @item-double-click="equipSpell"
    @favorite="toggleFavorite"
    @hotkey="openHotkeyPicker"
  >
    <template #default="{ item, active, onSelect }">
      <spell-item
        v-if="isSpellItem(item)"
        :spell="item"
        :active="active"
        @click="onSelect"
      />
    </template>

    <template #preview>
      <spell-preview
        v-if="activeSpellData"
        :data="activeSpellData"
      />
    </template>
  </inventory-list>
</template>

<script setup lang="ts">
import { InventoryList } from '@/features/ui';
import { SpellItem, SpellPreview } from '@/entities/ui';
import { useMagicSpellActions } from '@/pages/magic/composables/useMagicSpellActions';
import { isSpellItem } from '@/stores/adapters/typeGuards';
import type { SpellItem as SpellItemType } from '@/stores/magic/types';

interface Props {
  spellsList: SpellItemType[];
  emptyMessage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  emptyMessage: 'Waiting for data...',
});

const { activeSpell, activeSpellData, equipSpell, toggleFavorite, openHotkeyPicker } = useMagicSpellActions(
  () => props.spellsList
);

</script>
