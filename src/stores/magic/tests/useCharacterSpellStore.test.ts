import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import type { SpellItem, MagicCategory } from '@/stores/magic/lib/types';

// =============================================================
// useMagicStore tests
// =============================================================

function makeSpell(overrides: Partial<SpellItem> = {}): SpellItem {
  return {
    name: 'Fireball',
    formId: '0xSpell1',
    categoryType: 'Destruction',
    cost: 50,
    costValue: 50,
    level: 50,
    castingType: 'FireAndForget',
    delivery: 'Aimed',
    range: 100,
    chargeTime: 0.5,
    effects: [],
    isFavorite: false,
    isEquipped: false,
    equippedHand: null,
    isActive: false,
    hotkeys: [],
    ...overrides,
  };
}

function makeCategory(overrides: Partial<MagicCategory> = {}): MagicCategory {
  return {
    categoryId: 'Destruction',
    name: 'Destruction',
    count: 5,
    ...overrides,
  };
}

describe('useMagicStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has categories undefined', () => {
      const store = useMagicStore();
      expect(store.categories).toBeUndefined();
    });

    it('has all school states with undefined items', () => {
      const store = useMagicStore();
      expect(store.destruction.items).toBeUndefined();
      expect(store.alteration.items).toBeUndefined();
      expect(store.conjuration.items).toBeUndefined();
      expect(store.illusion.items).toBeUndefined();
      expect(store.restoration.items).toBeUndefined();
      expect(store.enchanting.items).toBeUndefined();
      expect(store.shouts.items).toBeUndefined();
    });
  });

  describe('setCategories', () => {
    it('stores categories', () => {
      const store = useMagicStore();
      const cat = makeCategory();
      store.setCategories([cat]);
      expect(store.categories).toEqual([cat]);
    });

    it('stores undefined categories', () => {
      const store = useMagicStore();
      store.setCategories(undefined);
      expect(store.categories).toBeUndefined();
    });
  });

  describe('setDestruction', () => {
    it('stores destruction spells', () => {
      const store = useMagicStore();
      const spell = makeSpell();
      store.setDestruction({ items: [spell] });
      expect(store.destruction.items).toEqual([spell]);
    });
  });

  describe('setAlteration', () => {
    it('stores alteration spells', () => {
      const store = useMagicStore();
      const spell = makeSpell({ categoryType: 'Alteration' });
      store.setAlteration({ items: [spell] });
      expect(store.alteration.items).toEqual([spell]);
    });
  });

  describe('setShouts', () => {
    it('stores shouts', () => {
      const store = useMagicStore();
      const shout = {
        name: 'Fus Ro Dah',
        formId: '0xShout1',
        description: 'Unrelenting Force',
        words: [],
        isEquipped: false,
        isFavorite: false,
        hotkeys: [],
      };
      store.setShouts({ items: [shout] });
      expect(store.shouts.items).toEqual([shout]);
    });
  });

  describe('computed lists', () => {
    it('destructionList is sorted alphabetically', () => {
      const store = useMagicStore();
      store.setDestruction({
        items: [makeSpell({ name: 'Fireball' }), makeSpell({ name: 'Frostbite' })],
      });
      expect(store.destructionList[0].name).toBe('Fireball');
      expect(store.destructionList[1].name).toBe('Frostbite');
    });

    it('alterationList is sorted alphabetically', () => {
      const store = useMagicStore();
      store.setAlteration({
        items: [
          makeSpell({ name: 'Stoneflesh', categoryType: 'Alteration' }),
          makeSpell({ name: 'Oakflesh', categoryType: 'Alteration' }),
        ],
      });
      expect(store.alterationList[0].name).toBe('Oakflesh');
      expect(store.alterationList[1].name).toBe('Stoneflesh');
    });

    it('shoutsList returns empty array when no items', () => {
      const store = useMagicStore();
      expect(store.shoutsList).toEqual([]);
    });

    it('shoutsList is sorted alphabetically', () => {
      const store = useMagicStore();
      store.setShouts({
        items: [
          { name: 'Fus Ro Dah', formId: '0x1', description: '', words: [], isEquipped: false, isFavorite: false, hotkeys: [] },
          { name: 'Aura Whisper', formId: '0x2', description: '', words: [], isEquipped: false, isFavorite: false, hotkeys: [] },
        ],
      });
      expect(store.shoutsList[0].name).toBe('Aura Whisper');
      expect(store.shoutsList[1].name).toBe('Fus Ro Dah');
    });
  });
});
