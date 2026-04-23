import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { HotkeySlot } from '@/api/websocket';
import type { HotkeyItemsState, HotkeySlotEntry } from './types';

const EMPTY_SLOTS: HotkeySlotEntry[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  slot: n as HotkeySlot,
  bound: false,
}));

export const useHotkeysStore = defineStore('hotkeys', () => {
  const slots = ref<HotkeySlotEntry[]>(EMPTY_SLOTS);

  const slotsBySlotNumber = computed<Record<number, HotkeySlotEntry>>(() => {
    const map: Record<number, HotkeySlotEntry> = {};
    slots.value.forEach((entry) => {
      map[entry.slot] = entry;
    });
    return map;
  });

  const getSlotForFormId = (formId: string | null | undefined): HotkeySlot | null => {
    if (!formId) return null;
    const found = slots.value.find((entry) => entry.bound && entry.formId === formId);
    return found ? (found.slot as HotkeySlot) : null;
  };

  const setHotkeys = (data: HotkeyItemsState): void => {
    const incoming = data.items ?? null;
    if (!Array.isArray(incoming)) return;

    // Normalize to exactly 8 ordered slots
    const normalized: HotkeySlotEntry[] = [1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
      const entry = incoming.find((e) => e.slot === slot);
      return entry ?? ({ slot: slot as HotkeySlot, bound: false } as HotkeySlotEntry);
    });
    slots.value = normalized;
  };

  return {
    slots,
    slotsBySlotNumber,
    getSlotForFormId,
    setHotkeys,
  };
});
