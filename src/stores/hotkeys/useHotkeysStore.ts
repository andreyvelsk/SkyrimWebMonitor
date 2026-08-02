import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { HotkeySlot } from '@/api/websocket';
import type { HotkeyItemsState, HotkeySlotEntry } from './lib/types';

const EMPTY_SLOTS: HotkeySlotEntry[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- values are hardcoded 1..8, guaranteed valid
  const slot: HotkeySlot = n as HotkeySlot;
  return { slot, bound: false };
});

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
    return found ? (found.slot) : null;
  };

  const setHotkeys = (data: HotkeyItemsState): void => {
    const incoming = data.items ?? null;
    if (!Array.isArray(incoming)) return;

    // Normalize to exactly 8 ordered slots
    const normalized: HotkeySlotEntry[] = [1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
      const entry = incoming.find((e) => e.slot === slot);
      if (entry) return entry;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- values are hardcoded 1..8, guaranteed valid
      const fallback: HotkeySlotEntry = { slot: slot as HotkeySlot, bound: false };
      return fallback;
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
