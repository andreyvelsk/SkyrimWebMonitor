<template>
  <div class="weapon-hand-picker">
    <div class="buttons">
      <button
        class="hand-button left"
        :class="{
          'hand-button--occupied':
            equippedHand === 'left' || equippedHand === 'both',
        }"
        @click="onSelectHand('left')"
      >
        <base-icon icon-path="sbed/hand.svg" :size="32" :flipped="true" />
      </button>
      <button
        class="hand-button right"
        :class="{
          'hand-button--occupied':
            equippedHand === 'right' || equippedHand === 'both',
        }"
        @click="onSelectHand('right')"
      >
        <base-icon icon-path="sbed/hand.svg" :size="32" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import BaseIcon from '../icons/BaseIcon.vue';
import type { EquipSlot, EquippedHand } from '@/stores/inventory/types';

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
.weapon-hand-picker {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  text-align: center;
}

.title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  color: var(--skyrim-text-primary);
}

.buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

.hand-button {
  position: relative;
  flex: 1;
  padding: var(--spacing-md) var(--spacing-lg);
  font-family: var(--font-heading);
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 2px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgb(201 162 39 / 12%);
    border-color: var(--skyrim-accent-gold-dim);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    border-color: var(--skyrim-accent-gold);
    background-color: rgb(201 162 39 / 20%);
  }

  &--occupied {
    background-color: rgb(201 162 39 / 20%);
    border-color: var(--skyrim-accent-gold-dim);

    &:hover {
      background-color: rgb(201 162 39 / 30%);
      border-color: var(--skyrim-accent-gold);
    }
  }
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: var(--font-size-xs);
  background-color: var(--skyrim-accent-gold);
  color: var(--skyrim-bg-dark);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-weight: 700;
}

.hand-icon--flipped {
  transform: scaleX(-1);
}
</style>
