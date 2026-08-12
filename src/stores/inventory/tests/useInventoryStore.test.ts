import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import type {
  WeaponItem,
  AmmoItem,
  ApparelItem,
  FoodItem,
  MiscItem,
  GemItem,
} from '@/stores/inventory/lib/types';

// =============================================================
// useInventoryStore tests
// =============================================================

function makeWeapon(overrides: Partial<WeaponItem> = {}): WeaponItem {
  return {
    count: 1,
    formId: '0xWeapon1',
    categoryType: 'Weapon',
    isFavorite: false,
    isStolen: false,
    name: 'Iron Sword',
    value: 25,
    weight: 10,
    baseDamage: 10,
    damage: 12,
    enchantment: null,
    enchantmentCharge: null,
    equipSlots: ['right'],
    equippedHand: null,
    isEquipped: false,
    isTwoHanded: false,
    weaponType: 'OneHandSword',
    ...overrides,
  };
}

function makeAmmo(overrides: Partial<AmmoItem> = {}): AmmoItem {
  return {
    count: 30,
    formId: '0xAmmo1',
    categoryType: 'Ammo',
    isFavorite: false,
    isStolen: false,
    name: 'Iron Arrow',
    value: 1,
    weight: 0.1,
    isEquipped: false,
    damage: 8,
    ...overrides,
  };
}

function makeApparel(overrides: Partial<ApparelItem> = {}): ApparelItem {
  return {
    count: 1,
    formId: '0xApparel1',
    categoryType: 'Apparel',
    isFavorite: false,
    isStolen: false,
    name: 'Iron Helmet',
    value: 60,
    weight: 5,
    armorRating: 15,
    armorType: 'Heavy',
    baseArmorRating: 15,
    bodySlots: ['Head'],
    enchantment: null,
    equipSlots: ['left'],
    isEquipped: false,
    ...overrides,
  };
}

function makeFood(overrides: Partial<FoodItem> = {}): FoodItem {
  return {
    count: 5,
    formId: '0xFood1',
    categoryType: 'Food',
    isFavorite: false,
    isStolen: false,
    name: 'Apple',
    value: 3,
    weight: 0.5,
    effects: [],
    ...overrides,
  };
}

function makeMisc(overrides: Partial<MiscItem> = {}): MiscItem {
  return {
    count: 1,
    formId: '0xMisc1',
    categoryType: 'Misc',
    isFavorite: false,
    isStolen: false,
    name: 'Basket',
    value: 1,
    weight: 0.5,
    ...overrides,
  };
}

function makeGem(overrides: Partial<GemItem> = {}): GemItem {
  return {
    count: 1,
    formId: '0xGem1',
    categoryType: 'SoulGem',
    isFavorite: false,
    isStolen: false,
    name: 'Petty Soul Gem',
    value: 10,
    weight: 0.1,
    capacity: 'Petty',
    containedSoul: 'None',
    ...overrides,
  };
}

describe('useInventoryStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has all category states with undefined items', () => {
      const store = useInventoryStore();
      expect(store.weapons.items).toBeUndefined();
      expect(store.weapons.ammo).toBeUndefined();
      expect(store.apparel.items).toBeUndefined();
      expect(store.food.items).toBeUndefined();
      expect(store.potions.items).toBeUndefined();
      expect(store.ingredients.items).toBeUndefined();
      expect(store.books.items).toBeUndefined();
      expect(store.scrolls.items).toBeUndefined();
      expect(store.keys.items).toBeUndefined();
      expect(store.misc.items).toBeUndefined();
      expect(store.misc.gems).toBeUndefined();
    });
  });

  describe('setWeapons', () => {
    it('sets weapons items', () => {
      const store = useInventoryStore();
      const weapon = makeWeapon();
      store.setWeapons({ items: [weapon] });
      expect(store.weapons.items).toEqual([weapon]);
    });

    it('sets ammo items', () => {
      const store = useInventoryStore();
      const ammo = makeAmmo();
      store.setWeapons({ ammo: [ammo] });
      expect(store.weapons.ammo).toEqual([ammo]);
    });

    it('does not overwrite items when only ammo is set', () => {
      const store = useInventoryStore();
      const weapon = makeWeapon();
      store.setWeapons({ items: [weapon] });
      store.setWeapons({ ammo: [makeAmmo()] });
      expect(store.weapons.items).toEqual([weapon]);
      expect(store.weapons.ammo).toHaveLength(1);
    });
  });

  describe('setMisc', () => {
    it('sets misc items', () => {
      const store = useInventoryStore();
      const item = makeMisc();
      store.setMisc({ items: [item] });
      expect(store.misc.items).toEqual([item]);
    });

    it('sets gems', () => {
      const store = useInventoryStore();
      const gem = makeGem();
      store.setMisc({ gems: [gem] });
      expect(store.misc.gems).toEqual([gem]);
    });

    it('does not overwrite items when only gems are set', () => {
      const store = useInventoryStore();
      const item = makeMisc();
      store.setMisc({ items: [item] });
      store.setMisc({ gems: [makeGem()] });
      expect(store.misc.items).toEqual([item]);
      expect(store.misc.gems).toHaveLength(1);
    });
  });

  describe('weaponsList', () => {
    it('combines weapons and ammo sorted by name', () => {
      const store = useInventoryStore();
      const sword = makeWeapon({ name: 'Iron Sword' });
      const arrow = makeAmmo({ name: 'Iron Arrow' });
      store.setWeapons({ items: [sword], ammo: [arrow] });
      expect(store.weaponsList).toHaveLength(2);
      expect(store.weaponsList[0].name).toBe('Iron Arrow');
      expect(store.weaponsList[1].name).toBe('Iron Sword');
    });

    it('returns only ammo when no weapons', () => {
      const store = useInventoryStore();
      const arrow = makeAmmo();
      store.setWeapons({ ammo: [arrow] });
      expect(store.weaponsList).toHaveLength(1);
      expect(store.weaponsList[0].name).toBe('Iron Arrow');
    });

    it('returns empty array when no data', () => {
      const store = useInventoryStore();
      expect(store.weaponsList).toEqual([]);
    });
  });

  describe('miscList', () => {
    it('combines misc items and gems sorted by name', () => {
      const store = useInventoryStore();
      const gem = makeGem({ name: 'Petty Soul Gem' });
      const misc = makeMisc({ name: 'Basket' });
      store.setMisc({ items: [misc], gems: [gem] });
      expect(store.miscList).toHaveLength(2);
      expect(store.miscList[0].name).toBe('Basket');
      expect(store.miscList[1].name).toBe('Petty Soul Gem');
    });
  });

  describe('all *List computeds sort alphabetically', () => {
    it('apparelList is sorted', () => {
      const store = useInventoryStore();
      store.setApparel({ items: [makeApparel({ name: 'Steel Helmet' }), makeApparel({ name: 'Iron Helmet' })] });
      expect(store.apparelList[0].name).toBe('Iron Helmet');
      expect(store.apparelList[1].name).toBe('Steel Helmet');
    });

    it('foodList is sorted', () => {
      const store = useInventoryStore();
      store.setFood({ items: [makeFood({ name: 'Cabbage' }), makeFood({ name: 'Apple' })] });
      expect(store.foodList[0].name).toBe('Apple');
      expect(store.foodList[1].name).toBe('Cabbage');
    });
  });

  describe('setApparel / setFood / setPotions / setIngredients / setBooks / setScrolls / setKeys', () => {
    it('setApparel stores data', () => {
      const store = useInventoryStore();
      const item = makeApparel();
      store.setApparel({ items: [item] });
      expect(store.apparel.items).toEqual([item]);
    });

    it('setFood stores data', () => {
      const store = useInventoryStore();
      const item = makeFood();
      store.setFood({ items: [item] });
      expect(store.food.items).toEqual([item]);
    });
  });
});
