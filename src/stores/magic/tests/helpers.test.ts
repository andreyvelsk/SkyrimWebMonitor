import { describe, it, expect } from 'vitest';
import { isMasterLevelSpell, getEffectiveEquippedHand } from '@/stores/magic/helpers';
import type { SpellItem } from '@/stores/magic/lib/types';

// =============================================================
// Magic Helpers tests
// =============================================================

function makeSpell(overrides: Partial<SpellItem> = {}): SpellItem {
  return {
    name: 'Test Spell',
    formId: '0x123',
    categoryType: 'Destruction',
    cost: 50,
    costValue: 50,
    level: 25,
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

describe('isMasterLevelSpell', () => {
  it('returns true for master level (100)', () => {
    const spell = makeSpell({ level: 100 });
    expect(isMasterLevelSpell(spell)).toBe(true);
  });

  it('returns true for level above master', () => {
    const spell = makeSpell({ level: 150 });
    expect(isMasterLevelSpell(spell)).toBe(true);
  });

  it('returns false for expert level (75)', () => {
    const spell = makeSpell({ level: 75 });
    expect(isMasterLevelSpell(spell)).toBe(false);
  });

  it('returns false for novice level (0)', () => {
    const spell = makeSpell({ level: 0 });
    expect(isMasterLevelSpell(spell)).toBe(false);
  });

  it('returns false for adept level (50)', () => {
    const spell = makeSpell({ level: 50 });
    expect(isMasterLevelSpell(spell)).toBe(false);
  });
});

describe('getEffectiveEquippedHand', () => {
  it('returns "both" for equipped master spell', () => {
    const spell = makeSpell({ level: 100, isEquipped: true, equippedHand: 'right' });
    expect(getEffectiveEquippedHand(spell)).toBe('both');
  });

  it('returns equippedHand for non-master spell', () => {
    const spell = makeSpell({ level: 25, isEquipped: true, equippedHand: 'left' });
    expect(getEffectiveEquippedHand(spell)).toBe('left');
  });

  it('returns equippedHand for master spell that is not equipped', () => {
    const spell = makeSpell({ level: 100, isEquipped: false, equippedHand: 'right' });
    expect(getEffectiveEquippedHand(spell)).toBe('right');
  });

  it('returns null for unequipped non-master spell', () => {
    const spell = makeSpell({ level: 25, isEquipped: false, equippedHand: null });
    expect(getEffectiveEquippedHand(spell)).toBeNull();
  });
});