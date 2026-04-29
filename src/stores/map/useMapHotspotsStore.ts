import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MapHotspot, MapHotspotsState } from './types';

export const useMapHotspotsStore = defineStore('mapHotspots', () => {
  /** Current list of hotspots. Empty until the server delivers a payload. */
  const hotspots = ref<MapHotspot[]>([]);

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

  return {
    hotspots,
    setHotspots,
  };
});
