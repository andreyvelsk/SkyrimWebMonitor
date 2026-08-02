import { describe, it, expect } from 'vitest';
import { getCategoryIconPath, getHotkeyIconPath } from '@/shared/lib/utils/hotkeyIcons';
import type { HotkeySlotEntry } from '@/stores/hotkeys/lib/types';

// =============================================================
// hotkeyIcons tests
// =============================================================

describe('getCategoryIconPath', () => {
  it('returns icon for Weapon category', () => {
    const result = getCategoryIconPath('Weapon');
    expect(result).toBe('lorc/crossed-swords.svg');
  });

  it('returns icon for Ammo category', () => {
    const result = getCategoryIconPath('Ammo');
    expect(result).toBe('lorc/arrow-cluster.svg');
  });

  it('returns icon for Apparel category', () => {
    const result = getCategoryIconPath('Apparel');
    expect(result).toBe('lorc/lamellar.svg');
  });

  it('returns icon for Book category', () => {
    const result = getCategoryIconPath('Book');
    expect(result).toBe('lorc/book-cover.svg');
  });

  it('returns icon for Potion category', () => {
    const result = getCategoryIconPath('Potion');
    expect(result).toBe('lorc/round-bottom-flask.svg');
  });

  it('returns icon for Food category', () => {
    const result = getCategoryIconPath('Food');
    expect(result).toBe('lorc/meat.svg');
  });

  it('returns icon for Ingredient category', () => {
    const result = getCategoryIconPath('Ingredient');
    expect(result).toBe('skoll/pestle-mortar.svg');
  });

  it('returns icon for Misc category', () => {
    const result = getCategoryIconPath('Misc');
    expect(result).toBe('lorc/swap-bag.svg');
  });

  it('returns icon for Key category', () => {
    const result = getCategoryIconPath('Key');
    expect(result).toBe('lorc/key.svg');
  });

  it('returns icon for SoulGem category', () => {
    const result = getCategoryIconPath('SoulGem');
    expect(result).toBe('lorc/crystal-shine.svg');
  });

  it('returns icon for Scroll category', () => {
    const result = getCategoryIconPath('Scroll');
    expect(result).toBe('lorc/scroll-unfurled.svg');
  });

  it('returns fallback for null', () => {
    const result = getCategoryIconPath(null);
    expect(result).toBe('lorc/cog.svg');
  });

  it('returns fallback for undefined', () => {
    const result = getCategoryIconPath(undefined);
    expect(result).toBe('lorc/cog.svg');
  });

  it('returns fallback for unknown category', () => {
    const result = getCategoryIconPath('Unknown');
    expect(result).toBe('lorc/cog.svg');
  });
});

describe('getHotkeyIconPath', () => {
  it('returns null for null entry', () => {
    expect(getHotkeyIconPath(null)).toBeNull();
  });

  it('returns null for undefined entry', () => {
    expect(getHotkeyIconPath(undefined)).toBeNull();
  });

  it('returns null for unbound entry', () => {
    const entry: HotkeySlotEntry = { slot: 1, bound: false };
    expect(getHotkeyIconPath(entry)).toBeNull();
  });

  it('returns weapon icon for weapon item with weaponType', () => {
    const entry: HotkeySlotEntry = {
      slot: 1,
      bound: true,
      kind: 'item',
      name: 'Iron Sword',
      formId: '0x123',
      categoryType: 'Weapon',
      count: 1,
      weight: 10,
      value: 25,
      isFavorite: false,
      weaponType: 'OneHandSword',
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('lorc/piercing-sword.svg');
  });

  it('returns apparel icon for apparel item with bodySlot', () => {
    const entry: HotkeySlotEntry = {
      slot: 2,
      bound: true,
      kind: 'item',
      name: 'Iron Helmet',
      formId: '0x456',
      categoryType: 'Apparel',
      count: 1,
      weight: 5,
      value: 60,
      isFavorite: false,
      bodySlot: 'Head',
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('caro-asercion/warlord-helmet.svg');
  });

  it('returns category icon for item without specific type', () => {
    const entry: HotkeySlotEntry = {
      slot: 3,
      bound: true,
      kind: 'item',
      name: 'Apple',
      formId: '0x789',
      categoryType: 'Food',
      count: 5,
      weight: 0.1,
      value: 3,
      isFavorite: false,
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('lorc/meat.svg');
  });

  it('returns school icon for spell with known school', () => {
    const entry: HotkeySlotEntry = {
      slot: 4,
      bound: true,
      kind: 'spell',
      name: 'Fireball',
      formId: '0xAAA',
      spellType: 'Spell',
      school: 'Destruction',
      cost: 50,
      level: 25,
      chargeTime: 0.5,
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('lorc/flaming-claw.svg');
  });

  it('returns shout icon for Shout spell type', () => {
    const entry: HotkeySlotEntry = {
      slot: 5,
      bound: true,
      kind: 'spell',
      name: 'Fus Ro Dah',
      formId: '0xBBB',
      spellType: 'Shout',
      school: 'None',
      cost: 0,
      level: 0,
      chargeTime: 0,
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('lorc/shouting.svg');
  });

  it('returns fallback for spell with unknown school', () => {
    const entry: HotkeySlotEntry = {
      slot: 6,
      bound: true,
      kind: 'spell',
      name: 'Unknown Spell',
      formId: '0xCCC',
      spellType: 'Spell',
      school: 'None',
      cost: 10,
      level: 0,
      chargeTime: 0,
    };
    const result = getHotkeyIconPath(entry);
    expect(result).toBe('lorc/cog.svg');
  });
});