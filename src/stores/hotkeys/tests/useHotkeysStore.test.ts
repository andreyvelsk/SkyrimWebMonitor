import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useHotkeysStore } from '@/stores/hotkeys/useHotkeysStore';
import type { HotkeySlotEntry, HotkeySlotItem, HotkeySlotSpell } from '@/stores/hotkeys/lib/types';

// =============================================================
// useHotkeysStore tests
// =============================================================

function makeItemSlot(slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, formId: string): HotkeySlotItem {
  return {
    slot,
    bound: true,
    kind: 'item',
    name: `Item ${slot}`,
    formId,
    categoryType: 'Weapon',
    count: 1,
    weight: 10,
    value: 100,
    isFavorite: false,
  };
}

function makeSpellSlot(slot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, formId: string): HotkeySlotSpell {
  return {
    slot,
    bound: true,
    kind: 'spell',
    name: `Spell ${slot}`,
    formId,
    spellType: 'Spell',
    school: 'Destruction',
    cost: 50,
    level: 25,
    chargeTime: 0.5,
  };
}

describe('useHotkeysStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has 8 empty slots', () => {
      const store = useHotkeysStore();
      const slots: HotkeySlotEntry[] = store.slots;
      expect(slots).toHaveLength(8);
      slots.forEach((slot: HotkeySlotEntry) => {
        expect(slot.bound).toBe(false);
      });
    });

    it('slots are numbered 1 through 8', () => {
      const store = useHotkeysStore();
      const slots: HotkeySlotEntry[] = store.slots;
      const slotNumbers: number[] = slots.map((s: HotkeySlotEntry) => s.slot);
      expect(slotNumbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });
  });

  describe('setHotkeys', () => {
    it('fills all 8 slots with provided data', () => {
      const store = useHotkeysStore();
      const entries: HotkeySlotEntry[] = [
        makeItemSlot(1, '0xA'), makeItemSlot(2, '0xB'), makeItemSlot(3, '0xC'),
        makeItemSlot(4, '0xD'), makeItemSlot(5, '0xE'), makeItemSlot(6, '0xF'),
        makeItemSlot(7, '0xG'), makeItemSlot(8, '0xH'),
      ];
      store.setHotkeys({ items: entries });
      const slots: HotkeySlotEntry[] = store.slots;
      expect(slots).toHaveLength(8);
      slots.forEach((slot: HotkeySlotEntry, i: number) => {
        expect(slot.bound).toBe(true);
        expect(slot.slot).toBe(i + 1);
      });
    });

    it('fills partial data with unbound slots', () => {
      const store = useHotkeysStore();
      const entries: HotkeySlotEntry[] = [makeItemSlot(1, '0xA'), makeItemSlot(3, '0xC')];
      store.setHotkeys({ items: entries });
      const slots: HotkeySlotEntry[] = store.slots;
      expect(slots[0].bound).toBe(true);
      expect(slots[1].bound).toBe(false);
      expect(slots[2].bound).toBe(true);
      expect(slots[3].bound).toBe(false);
    });

    it('does not change state when items is null', () => {
      const store = useHotkeysStore();
      const slots: HotkeySlotEntry[] = store.slots;
      const initialSlots: HotkeySlotEntry[] = [...slots];
      store.setHotkeys({ items: null });
      expect(store.slots).toEqual(initialSlots);
    });

    it('does not change state when items is not an array', () => {
      const store = useHotkeysStore();
      const slots: HotkeySlotEntry[] = store.slots;
      const initialSlots: HotkeySlotEntry[] = [...slots];
      // @ts-expect-error TODO: testing invalid input — remove after store adds runtime validation
      store.setHotkeys({ items: 'not-an-array' });
      expect(store.slots).toEqual(initialSlots);
    });

    it('handles mixed item and spell slots', () => {
      const store = useHotkeysStore();
      const entries: HotkeySlotEntry[] = [makeItemSlot(1, '0xA'), makeSpellSlot(2, '0xB')];
      store.setHotkeys({ items: entries });
      const slots: HotkeySlotEntry[] = store.slots;
      const slot0: HotkeySlotEntry = slots[0];
      expect(slot0.bound).toBe(true);
      if (slot0.bound) {
        expect(slot0.kind).toBe('item');
      }
      const slot1: HotkeySlotEntry = slots[1];
      expect(slot1.bound).toBe(true);
      if (slot1.bound) {
        expect(slot1.kind).toBe('spell');
      }
    });
  });

  describe('getSlotForFormId', () => {
    it('returns slot number for existing formId', () => {
      const store = useHotkeysStore();
      store.setHotkeys({ items: [makeItemSlot(3, '0xTarget')] });
      expect(store.getSlotForFormId('0xTarget')).toBe(3);
    });

    it('returns null for non-existing formId', () => {
      const store = useHotkeysStore();
      store.setHotkeys({ items: [makeItemSlot(1, '0xA')] });
      expect(store.getSlotForFormId('0xMissing')).toBeNull();
    });

    it('returns null for null formId', () => {
      const store = useHotkeysStore();
      expect(store.getSlotForFormId(null)).toBeNull();
    });

    it('returns null for undefined formId', () => {
      const store = useHotkeysStore();
      expect(store.getSlotForFormId(undefined)).toBeNull();
    });
  });

  describe('slotsBySlotNumber', () => {
    it('maps slots by their slot number', () => {
      const store = useHotkeysStore();
      const item = makeItemSlot(3, '0xTarget');
      store.setHotkeys({ items: [makeItemSlot(1, '0xA'), item] });
      const map: Record<number, HotkeySlotEntry> = store.slotsBySlotNumber;
      expect(map[1].bound).toBe(true);
      expect(map[3].bound).toBe(true);
      expect(map[3].slot).toBe(3);
      const bound: HotkeySlotEntry = map[3];
      if (bound.bound) {
        expect(bound.formId).toBe('0xTarget');
      }
    });
  });
});
