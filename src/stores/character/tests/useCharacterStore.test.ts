import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCharacterStore } from '@/stores/character/useCharacterStore';
import type { CharacterStats } from '@/stores/character/lib/types';

// =============================================================
// useCharacterStore tests
// =============================================================

function makeStats(overrides: Partial<CharacterStats> = {}): CharacterStats {
  return {
    health: 200,
    magicka: 150,
    stamina: 180,
    healthBase: 200,
    magickaBase: 150,
    staminaBase: 200,
    level: 25,
    xp: 5000,
    xpNext: 10000,
    inventoryWeight: 120,
    carryWeight: 300,
    gold: 5000,
    ...overrides,
  };
}

describe('useCharacterStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('has all stats fields undefined', () => {
      const store = useCharacterStore();
      expect(store.stats.health).toBeUndefined();
      expect(store.stats.magicka).toBeUndefined();
      expect(store.stats.stamina).toBeUndefined();
      expect(store.stats.healthBase).toBeUndefined();
      expect(store.stats.magickaBase).toBeUndefined();
      expect(store.stats.staminaBase).toBeUndefined();
      expect(store.stats.level).toBeUndefined();
      expect(store.stats.xp).toBeUndefined();
      expect(store.stats.xpNext).toBeUndefined();
      expect(store.stats.inventoryWeight).toBeUndefined();
      expect(store.stats.carryWeight).toBeUndefined();
      expect(store.stats.gold).toBeUndefined();
    });

    it('has statsPercentage at 0%', () => {
      const store = useCharacterStore();
      expect(store.statsPercentage.health).toBe(0);
      expect(store.statsPercentage.magicka).toBe(0);
      expect(store.statsPercentage.stamina).toBe(0);
    });

    it('has xpProgress at 0', () => {
      const store = useCharacterStore();
      expect(store.xpProgress).toBe(0);
    });
  });

  describe('setStats', () => {
    it('sets partial stats and merges with existing', () => {
      const store = useCharacterStore();
      store.setStats({ health: 100, magicka: 50 });
      expect(store.stats.health).toBe(100);
      expect(store.stats.magicka).toBe(50);
      // existing fields remain undefined
      expect(store.stats.stamina).toBeUndefined();
    });

    it('sets all stats fields', () => {
      const store = useCharacterStore();
      const full = makeStats();
      store.setStats(full);
      expect(store.stats.health).toBe(200);
      expect(store.stats.magicka).toBe(150);
      expect(store.stats.stamina).toBe(180);
      expect(store.stats.level).toBe(25);
      expect(store.stats.gold).toBe(5000);
    });

    it('merges successive calls', () => {
      const store = useCharacterStore();
      store.setStats({ health: 100 });
      store.setStats({ magicka: 50 });
      expect(store.stats.health).toBe(100);
      expect(store.stats.magicka).toBe(50);
    });

    it('overwrites previously set values', () => {
      const store = useCharacterStore();
      store.setStats({ health: 100 });
      store.setStats({ health: 200 });
      expect(store.stats.health).toBe(200);
    });
  });

  describe('statsPercentage', () => {
    it('calculates correct health percentage', () => {
      const store = useCharacterStore();
      store.setStats({ health: 100, healthBase: 200 });
      expect(store.statsPercentage.health).toBe(50);
    });

    it('calculates correct magicka percentage', () => {
      const store = useCharacterStore();
      store.setStats({ magicka: 75, magickaBase: 150 });
      expect(store.statsPercentage.magicka).toBe(50);
    });

    it('calculates correct stamina percentage', () => {
      const store = useCharacterStore();
      store.setStats({ stamina: 180, staminaBase: 200 });
      expect(store.statsPercentage.stamina).toBe(90);
    });

    it('returns 0% when maxValue is 0', () => {
      const store = useCharacterStore();
      store.setStats({ health: 50, healthBase: 0 });
      expect(store.statsPercentage.health).toBe(0);
    });

    it('returns 0% when value is null', () => {
      const store = useCharacterStore();
      store.setStats({ health: null, healthBase: 200 });
      expect(store.statsPercentage.health).toBe(0);
    });

    it('returns 0% when value is undefined', () => {
      const store = useCharacterStore();
      store.setStats({ healthBase: 200 });
      expect(store.statsPercentage.health).toBe(0);
    });

    it('returns 0% when maxValue is null', () => {
      const store = useCharacterStore();
      store.setStats({ health: 50, healthBase: null });
      expect(store.statsPercentage.health).toBe(0);
    });
  });

  describe('xpProgress', () => {
    it('calculates correct xp progress', () => {
      const store = useCharacterStore();
      store.setStats({ xp: 5000, xpNext: 10000 });
      expect(store.xpProgress).toBe(50);
    });

    it('returns 0 when xpNext is 0', () => {
      const store = useCharacterStore();
      store.setStats({ xp: 5000, xpNext: 0 });
      expect(store.xpProgress).toBe(0);
    });

    it('returns 0 when xp is undefined', () => {
      const store = useCharacterStore();
      store.setStats({ xpNext: 10000 });
      expect(store.xpProgress).toBe(0);
    });

    it('returns 0 when xpNext is undefined', () => {
      const store = useCharacterStore();
      store.setStats({ xp: 5000 });
      expect(store.xpProgress).toBe(0);
    });

    it('returns 0 when xp is null', () => {
      const store = useCharacterStore();
      store.setStats({ xp: null, xpNext: 10000 });
      expect(store.xpProgress).toBe(0);
    });

    it('returns 0 when xpNext is null', () => {
      const store = useCharacterStore();
      store.setStats({ xp: 5000, xpNext: null });
      expect(store.xpProgress).toBe(0);
    });

    it('returns 100 when xp equals xpNext', () => {
      const store = useCharacterStore();
      store.setStats({ xp: 10000, xpNext: 10000 });
      expect(store.xpProgress).toBe(100);
    });
  });
});
