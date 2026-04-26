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

    <hotkey-slots-grid
      :active-slot="currentSlot"
      gap="sm"
      class="hotkey-picker-grid"
      @select="handleSlotClick"
    />
  </div>
</template>

<script setup lang="ts">
import HotkeySlotsGrid from './HotkeySlotsGrid.vue';
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

function handleSlotClick(slot: HotkeySlot) {
  emit('select', slot);
}
</script>

<style scoped lang="scss">
/*
 * Modal frame, title, subtitle and button styles come from the
 * design system (.modal-content, .modal-header, .modal-title,
 * .modal-subtitle, .btn). Slot grid is provided by HotkeySlotsGrid.
 */

.hotkey-picker-modal {
  min-width: 320px;
}

.hotkey-picker-grid :deep(.slot-btn) {
  min-width: 90px;
}
</style>
