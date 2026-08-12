import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';
import type { GameStatus } from '@/stores/game/lib/types';

// =============================================================
// useGameStatusStore tests
// =============================================================

function makeStatus(overrides: Partial<GameStatus> = {}): GameStatus {
  return {
    paused: false,
    loading: false,
    inMainMenu: false,
    inDialogue: false,
    inCombat: false,
    dead: false,
    controlsEnabled: true,
    canAct: true,
    ...overrides,
  };
}

describe('useGameStatusStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('status is null', () => {
      const store = useGameStatusStore();
      expect(store.status).toBeNull();
    });

    it('canAct is false', () => {
      const store = useGameStatusStore();
      expect(store.canAct).toBe(false);
    });

    it('paused is false', () => {
      const store = useGameStatusStore();
      expect(store.paused).toBe(false);
    });

    it('loading is false', () => {
      const store = useGameStatusStore();
      expect(store.loading).toBe(false);
    });

    it('controlsEnabled is true', () => {
      const store = useGameStatusStore();
      expect(store.controlsEnabled).toBe(true);
    });
  });

  describe('setStatus', () => {
    it('updates status and all computed flags', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ inCombat: true, canAct: false }));
      expect(store.inCombat).toBe(true);
      expect(store.canAct).toBe(false);
      expect(store.dead).toBe(false);
    });

    it('detects paused state', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ paused: true }));
      expect(store.paused).toBe(true);
    });

    it('detects loading state', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ loading: true, canAct: false }));
      expect(store.loading).toBe(true);
      expect(store.canAct).toBe(false);
    });

    it('detects inMainMenu', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ inMainMenu: true }));
      expect(store.inMainMenu).toBe(true);
    });

    it('detects inDialogue', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ inDialogue: true }));
      expect(store.inDialogue).toBe(true);
    });

    it('detects dead', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ dead: true, canAct: false }));
      expect(store.dead).toBe(true);
      expect(store.canAct).toBe(false);
    });

    it('detects controlsEnabled false', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ controlsEnabled: false }));
      expect(store.controlsEnabled).toBe(false);
    });

    it('canAct reflects true', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ canAct: true }));
      expect(store.canAct).toBe(true);
    });
  });

  describe('reset', () => {
    it('sets status back to null', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ inCombat: true }));
      store.reset();
      expect(store.status).toBeNull();
    });

    it('resets all computed flags to defaults', () => {
      const store = useGameStatusStore();
      store.setStatus(makeStatus({ inCombat: true, canAct: true }));
      store.reset();
      expect(store.canAct).toBe(false);
      expect(store.paused).toBe(false);
      expect(store.inCombat).toBe(false);
    });
  });
});
