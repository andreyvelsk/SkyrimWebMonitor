<template>
  <div class="hotkey-picker-modal">
    <div class="header">
      <h3 class="title">
        {{ $t('modals.hotkeys.title') }}
      </h3>
      <p
        v-if="itemName"
        class="item-name"
      >
        {{ itemName }}
      </p>
    </div>

    <div class="slots-grid">
      <button
        v-for="slot in slots"
        :key="slot"
        type="button"
        class="slot-btn"
        :class="{ active: slot === currentSlot }"
        @click="handleSlotClick(slot)"
      >
        {{ slot }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { HotkeySlot } from '@/api/websocket';

interface Props {
  currentSlot?: HotkeySlot | null;
  itemName?: string | null;
}

withDefaults(defineProps<Props>(), {
  currentSlot: null,
  itemName: null,
});

const emit = defineEmits<{
  select: [slot: HotkeySlot];
  close: [];
}>();

const slots: HotkeySlot[] = [1, 2, 3, 4, 5, 6, 7, 8];

function handleSlotClick(slot: HotkeySlot) {
  emit('select', slot);
}
</script>

<style scoped lang="scss">
.hotkey-picker-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  min-width: 320px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  text-align: center;
}

.title {
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  color: var(--skyrim-text-primary);
  margin: 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.item-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-base);
  color: var(--skyrim-accent-gold);
  margin: 0;
}

.hint {
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
  margin: 0;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.slot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  min-width: 90px;
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: var(--tab-bg-hover);
    border-color: var(--skyrim-accent-gold-dim);
  }

  &:active {
    background-color: var(--tab-bg-active);
  }

  &.active {
    color: var(--skyrim-accent-gold);
    border-color: var(--skyrim-accent-gold);
    background-color: var(--tab-bg-active);
  }
}
</style>
