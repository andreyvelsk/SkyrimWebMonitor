import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMapPlayerStore } from '@/stores/map/useMapPlayerStore';
import type { PlayerPosition, ExteriorPosition } from '@/stores/map/lib/types';

// =============================================================
// useMapPlayerStore tests
// =============================================================

function makePlayerPosition(overrides: Partial<PlayerPosition> = {}): PlayerPosition {
  return {
    x: 1000,
    y: 2000,
    z: 0,
    angle: 1.5,
    cell: 'Wilderness',
    cellFormId: '0xCell1',
    isInterior: false,
    worldspace: 'Tamriel',
    worldspaceFormId: '0xWS1',
    parentWorldspace: 'Tamriel',
    parentWorldspaceFormId: '0xWS1',
    ...overrides,
  };
}

function makeExteriorPosition(overrides: Partial<ExteriorPosition> = {}): ExteriorPosition {
  return {
    x: 500,
    y: 600,
    z: 0,
    worldspace: 'Tamriel',
    worldspaceFormId: '0xWS1',
    parentWorldspace: 'Tamriel',
    parentWorldspaceFormId: '0xWS1',
    ...overrides,
  };
}

// Mock useWebSocketStore for requestExteriorPosition tests
vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: vi.fn(() => ({
    sendQuery: vi.fn(),
  })),
}));

describe('useMapPlayerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('position is null', () => {
      const store = useMapPlayerStore();
      expect(store.position).toBeNull();
    });

    it('exteriorPosition is null', () => {
      const store = useMapPlayerStore();
      expect(store.exteriorPosition).toBeNull();
    });

    it('currentMapWorldspace is Tamriel', () => {
      const store = useMapPlayerStore();
      expect(store.currentMapWorldspace).toBe('Tamriel');
    });

    it('displayPosition is null', () => {
      const store = useMapPlayerStore();
      expect(store.displayPosition).toBeNull();
    });
  });

  describe('setPosition', () => {
    it('updates position with live data (outside Tamriel)', () => {
      const store = useMapPlayerStore();
      const pos = makePlayerPosition();
      store.setPosition(pos);
      expect(store.position).toEqual(pos);
    });

    it('displayPosition returns live coords when outside Tamriel', () => {
      const store = useMapPlayerStore();
      const pos = makePlayerPosition({ x: 1000, y: 2000, angle: 1.5 });
      store.setPosition(pos);
      expect(store.displayPosition).toEqual({
        x: 1000,
        y: 2000,
        angle: 1.5,
        pinned: false,
      });
    });

    it('displayPosition returns null when position is null', () => {
      const store = useMapPlayerStore();
      store.setPosition(null);
      expect(store.displayPosition).toBeNull();
    });

    it('displayPosition returns null when position is undefined', () => {
      const store = useMapPlayerStore();
      store.setPosition(undefined);
      expect(store.displayPosition).toBeNull();
    });
  });

  describe('setCurrentMapWorldspace', () => {
    it('updates currentMapWorldspace', () => {
      const store = useMapPlayerStore();
      store.setCurrentMapWorldspace('DLC2SolstheimWorld');
      expect(store.currentMapWorldspace).toBe('DLC2SolstheimWorld');
    });
  });

  describe('displayPosition with exterior position', () => {
    it('returns pinned position when exterior matches map worldspace', () => {
      const store = useMapPlayerStore();
      // Set player in interior
      const pos = makePlayerPosition({
        x: 0,
        y: 0,
        angle: 2.0,
        isInterior: true,
        parentWorldspace: 'Tamriel',
        worldspace: null,
      });
      store.setPosition(pos);
      // Manually set exterior position (normally done by query callback)
      const ext = makeExteriorPosition({ x: 500, y: 600, parentWorldspace: 'Tamriel' });
      store.$patch({ exteriorPosition: ext });
      expect(store.displayPosition).toEqual({
        x: 500,
        y: 600,
        angle: 2.0,
        pinned: true,
      });
    });
  });
});
