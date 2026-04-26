<template>
  <div class="modal-content text-center weapon-hand-picker">
    <div class="d-flex justify-center gap-md">
      <button
        class="hand-button left"
        :class="{
          'hand-button--occupied':
            equippedHand === 'left' || equippedHand === 'both',
        }"
        @click="onSelectHand('left')"
      >
        <base-icon
          icon-path="sbed/hand.svg"
          :size="32"
          :flipped="true"
        />
      </button>
      <button
        class="hand-button right"
        :class="{
          'hand-button--occupied':
            equippedHand === 'right' || equippedHand === 'both',
        }"
        @click="onSelectHand('right')"
      >
        <base-icon
          icon-path="sbed/hand.svg"
          :size="32"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '../icons/BaseIcon.vue';
import type { EquipSlot, EquippedHand } from '@/shared/lib/types/common';

interface Props {
  mode?: 'equip' | 'equipped';
  equippedHand?: EquippedHand;
}

withDefaults(defineProps<Props>(), {
  mode: 'equip',
  equippedHand: null,
});

const emit = defineEmits<{
  selectHand: [hand: EquipSlot];
}>();

function onSelectHand(hand: EquipSlot) {
  emit('selectHand', hand);
}
</script>

<style scoped lang="scss">
/*
 * Layout uses utility/component classes; only hand-button visual state
 * (size, occupied modifier) is component-specific.
 */

.hand-button {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 2px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  &--occupied {
    background-color: var(--bg-accent-strong);
    border-color: var(--skyrim-accent-gold-dim);

    @media (hover: hover) {
      &:hover {
        background-color: var(--skyrim-border-glow);
        border-color: var(--skyrim-accent-gold);
      }
    }
  }
}
</style>
