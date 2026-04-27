<template>
  <div
    class="slots-grid"
    :class="`slots-grid--gap-${gap}`"
  >
    <button
      v-for="entry in slots"
      :key="entry.slot"
      type="button"
      class="btn slot-btn"
      :class="{ active: entry.slot === activeSlot }"
      :disabled="disableInactive && !entry.bound"
      @click="emit('select', entry.slot)"
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
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { BaseIcon } from '@/shared/ui';
import { useHotkeysStore } from '@/stores/hotkeys/useHotkeysStore';
import { getHotkeyIconPath } from '@/shared/lib/utils/hotkeyIcons';
import type { HotkeySlot } from '@/api/websocket';
import type { HotkeySlotEntry } from '@/stores/hotkeys/types';

interface Props {
  activeSlot?: HotkeySlot | null;
  gap?: 'sm' | 'md';
  disableInactive?: boolean;
}

withDefaults(defineProps<Props>(), {
  activeSlot: null,
  gap: 'md',
  disableInactive: false,
});

const emit = defineEmits<{
  select: [slot: HotkeySlot];
}>();

const hotkeysStore = useHotkeysStore();
const { slots } = storeToRefs(hotkeysStore);

function iconFor(entry: HotkeySlotEntry): string {
  return getHotkeyIconPath(entry) ?? 'lorc/cog.svg';
}
</script>

<style scoped lang="scss">
.slots-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  width: 100%;
}

.slots-grid--gap-sm {
  gap: var(--spacing-sm);
}

.slots-grid--gap-md {
  gap: var(--spacing-md);
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
  font-weight: var(--font-weight-semibold);
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
