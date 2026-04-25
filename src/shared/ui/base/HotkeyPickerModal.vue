<template>
  <div class="modal-content hotkey-picker-modal">
    <div class="modal-header">
      <h3 class="modal-title">
        {{ $t('modals.hotkeys.title') }}
      </h3>
      <p
        v-if="itemName"
        class="modal-subtitle"
      >
        {{ itemName }}
      </p>
    </div>

    <div class="slots-grid">
      <button
        v-for="slot in slots"
        :key="slot"
        type="button"
        class="btn btn-lg slot-btn"
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
/*
 * Modal frame, title, subtitle and button styles come from the
 * design system (.modal-content, .modal-header, .modal-title,
 * .modal-subtitle, .btn). Only the slot grid layout is unique.
 */

.hotkey-picker-modal {
  min-width: 320px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.slot-btn {
  aspect-ratio: 1 / 1;
  min-width: 90px;
  font-size: var(--font-size-lg);
  font-weight: 700;
}
</style>
