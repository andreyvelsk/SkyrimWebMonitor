import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMapHotspotsStore } from '@/stores/map/useMapHotspotsStore';
import type { MapHotspot, MapQuestMarker } from '@/stores/map/lib/types';

// =============================================================
// useMapHotspotsStore tests
// =============================================================

function makeHotspot(overrides: Partial<MapHotspot> = {}): MapHotspot {
  return {
    type: 'Cave',
    typeId: 1,
    refId: '0xRef1',
    name: 'Embershard Mine',
    x: 1000,
    y: 2000,
    isVisible: true,
    canFastTravel: true,
    ...overrides,
  };
}

function makeQuestMarker(overrides: Partial<MapQuestMarker> = {}): MapQuestMarker {
  return {
    aliasId: 1,
    cell: null,
    cellFormId: null,
    isInterior: false,
    name: 'Find the treasure',
    objectiveIndex: 0,
    objectiveText: 'Find the treasure',
    objectiveTextResolved: 'Find the treasure',
    parentWorldspace: 'Tamriel',
    parentWorldspaceFormId: null,
    questEditorId: 'MQ101',
    questFormId: '0xQ1',
    questName: 'Main Quest',
    questType: 'Main',
    refId: '0xRef2',
    worldspace: 'Tamriel',
    worldspaceFormId: null,
    x: 3000,
    y: 4000,
    z: 0,
    ...overrides,
  };
}

describe('useMapHotspotsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('hotspots is empty array', () => {
      const store = useMapHotspotsStore();
      expect(store.hotspots).toEqual([]);
    });

    it('questMarkers is empty array', () => {
      const store = useMapHotspotsStore();
      expect(store.questMarkers).toEqual([]);
    });
  });

  describe('setHotspots', () => {
    it('stores hotspots from { hot: [...] } payload', () => {
      const store = useMapHotspotsStore();
      const hotspot = makeHotspot();
      store.setHotspots({ hot: [hotspot] });
      expect(store.hotspots).toEqual([hotspot]);
    });

    it('stores hotspots from bare array', () => {
      const store = useMapHotspotsStore();
      const hotspot = makeHotspot();
      store.setHotspots([hotspot]);
      expect(store.hotspots).toEqual([hotspot]);
    });

    it('sets empty array for null', () => {
      const store = useMapHotspotsStore();
      store.setHotspots({ hot: [makeHotspot()] });
      store.setHotspots(null);
      expect(store.hotspots).toEqual([]);
    });

    it('sets empty array for undefined', () => {
      const store = useMapHotspotsStore();
      store.setHotspots({ hot: [makeHotspot()] });
      store.setHotspots(undefined);
      expect(store.hotspots).toEqual([]);
    });

    it('sets empty array when hot is not an array', () => {
      const store = useMapHotspotsStore();
      // @ts-expect-error TODO: testing invalid input — remove after store adds runtime validation
      store.setHotspots({ hot: 'not-an-array' });
      expect(store.hotspots).toEqual([]);
    });
  });

  describe('setQuestMarkers', () => {
    it('stores markers from { marker: [...] } payload', () => {
      const store = useMapHotspotsStore();
      const marker = makeQuestMarker();
      store.setQuestMarkers({ marker: [marker] });
      expect(store.questMarkers).toEqual([marker]);
    });

    it('stores markers from bare array', () => {
      const store = useMapHotspotsStore();
      const marker = makeQuestMarker();
      store.setQuestMarkers([marker]);
      expect(store.questMarkers).toEqual([marker]);
    });

    it('sets empty array for null', () => {
      const store = useMapHotspotsStore();
      store.setQuestMarkers({ marker: [makeQuestMarker()] });
      store.setQuestMarkers(null);
      expect(store.questMarkers).toEqual([]);
    });

    it('sets empty array for undefined', () => {
      const store = useMapHotspotsStore();
      store.setQuestMarkers(undefined);
      expect(store.questMarkers).toEqual([]);
    });
  });
});
