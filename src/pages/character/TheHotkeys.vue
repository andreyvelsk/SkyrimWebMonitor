<template>
  <div class="d-flex flex-1 flex-center p-md">
    <div class="slots-grid">
      <button
        v-for="entry in slots"
        :key="entry.slot"
        type="button"
        class="btn slot-btn"
        :class="{ active: entry.bound }"
        @click="triggerSlot(entry.slot)"
      >
        <span class="slot-number">
          {{ entry.slot }}
        </span>
        <div
          v-if="entry.bound"
          class="slot-icon"
        >
          <base-icon
            :icon-path="iconFor(entry)"
            :size="20"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { BaseIcon } from '@/shared/ui';
import { useHotkeysStore } from '@/stores/hotkeys/useHotkeysStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { getHotkeyIconPath } from '@/shared/lib/utils/hotkeyIcons';
import type { HotkeySlot } from '@/api/websocket';
import type { HotkeySlotEntry } from '@/stores/hotkeys/types';

const hotkeysStore = useHotkeysStore();
const { slots } = storeToRefs(hotkeysStore);
const wsStore = useWebSocketStore();

function triggerSlot(slot: HotkeySlot) {
  wsStore.sendCommand({ command: 'hotkey_trigger', slot });
}

function iconFor(entry: HotkeySlotEntry): string {
  return getHotkeyIconPath(entry) ?? 'lorc/cog.svg';
}
</script>

<style scoped lang="scss">
/* Layout uses utility classes (.d-flex, .flex-1, .flex-center, .p-md);
   button base via .btn from the design system. Only grid + slot decoration is local. */

.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: var(--spacing-md);
  width: 100%;
  max-width: 640px;
}

.slot-btn {
  position: relative;
  flex-direction: column;
  gap: var(--spacing-xs);
  aspect-ratio: 1 / 1;
  padding: var(--spacing-md);
}

.slot-number {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--skyrim-accent-gold);
  line-height: 1;
}

.slot-icon {
  position: absolute;
  right: var(--spacing-xs);
  bottom: var(--spacing-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;

  --skyrim-text-accent: var(--skyrim-text-primary);
}
</style>
