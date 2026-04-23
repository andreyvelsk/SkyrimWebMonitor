<template>
  <div class="hotkeys-page">
    <div class="slots-grid">
      <button
        v-for="entry in slots"
        :key="entry.slot"
        type="button"
        class="slot-btn"
        :class="{ bound: entry.bound }"
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
.hotkeys-page {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  aspect-ratio: 1 / 1;
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);
  color: var(--skyrim-text-secondary);
  font-family: var(--font-heading);

  &:hover {
    background-color: var(--tab-bg-hover);
    border-color: var(--skyrim-accent-gold-dim);
    color: var(--skyrim-text-primary);
  }

  &:active {
    background-color: var(--tab-bg-active);
  }

  &.bound {
    color: var(--skyrim-text-primary);
    border-color: var(--skyrim-accent-gold-dim);
  }
}

.slot-number {
  font-size: var(--font-size-xl, 1.5rem);
  font-weight: 700;
  color: var(--skyrim-accent-gold);
  line-height: 1;
}

.slot-name {
  font-size: var(--font-size-sm);
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 var(--spacing-xs);

  &--empty {
    color: var(--skyrim-text-secondary);
    font-style: italic;
  }
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
