<template>
  <div class="weapon-hand-picker">
    <div class="buttons">
      <button
        class="hand-button left"
        @click="onSelectHand('left')"
      >
        <div
          class="hand-icon hand-icon--flipped"
          :style="{ '--icon-src': `url('${leftHandIconPath}')` }"
        />
      </button>
      <button
        class="hand-button right"
        @click="onSelectHand('right')"
      >
        <div
          class="hand-icon"
          :style="{ '--icon-src': `url('${rightHandIconPath}')` }"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { buildIconPath } from '@/shared/lib/utils/iconPath';
import type { EquipSlot } from '@/stores/inventory/types';

const emit = defineEmits<{
  selectHand: [hand: EquipSlot];
}>();

const leftHandIconPath = computed(() => buildIconPath('sbed/hand.svg'));
const rightHandIconPath = computed(() => buildIconPath('sbed/hand.svg'));

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
  margin: 0 0 var(--spacing-md) 0;
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
}

.hand-icon {
  width: 32px;
  height: 32px;
  background-color: var(--skyrim-text-accent);
  -webkit-mask-image: var(--icon-src);
  mask-image: var(--icon-src);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;

  &--flipped {
    transform: scaleX(-1);
  }
}
</style>
