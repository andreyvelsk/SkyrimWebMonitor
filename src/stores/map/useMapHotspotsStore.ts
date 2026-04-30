import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  MapHotspot,
  MapHotspotsState,
  MapQuestMarker,
  MapQuestMarkersState,
} from './types';

export const useMapHotspotsStore = defineStore('mapHotspots', () => {
  /** Current list of hotspots. Empty until the server delivers a payload. */
  const hotspots = ref<MapHotspot[]>([]);
  /** Current list of quest objective markers. */
  const questMarkers = ref<MapQuestMarker[]>([]);

  /**
   * Replace the hotspot list. Accepts either the raw `{ hot: [...] }` payload
   * or a bare array, so the store works regardless of how the data router
   * unwraps the WebSocket envelope.
   */
  const setHotspots = (data: MapHotspotsState | MapHotspot[] | null | undefined): void => {
    if (!data) {
      hotspots.value = [];
      return;
    }
    if (Array.isArray(data)) {
      hotspots.value = data;
      return;
    }
    hotspots.value = Array.isArray(data.hot) ? data.hot : [];
  };

  /** Replace quest marker list from `{ marker: [...] }` payload or bare array. */
  const setQuestMarkers = (
    data: MapQuestMarkersState | MapQuestMarker[] | null | undefined
  ): void => {
    if (!data) {
      questMarkers.value = [];
      return;
    }
    if (Array.isArray(data)) {
      questMarkers.value = data;
      return;
    }
    questMarkers.value = Array.isArray(data.marker) ? data.marker : [];
  };

  return {
    hotspots,
    questMarkers,
    setHotspots,
    setQuestMarkers,
  };
});
