import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlayerPosition } from './types';

/**
 * Holds the player's current position + heading. Updated at high frequency
 * by the game server, so the setter is intentionally minimal — no
 * normalization, no allocation beyond the ref write.
 */
export const useMapPlayerStore = defineStore('mapPlayer', () => {
  const position = ref<PlayerPosition | null>({
            "angle": 4.993187427520752,
            "cell": "ChargenExit",
            "cellFormId": "0x000097EE",
            "isInterior": false,
            "parentWorldspace": "Tamriel",
            "parentWorldspaceFormId": "0x0000003C",
            "worldspace": "Tamriel",
            "worldspaceFormId": "0x0000003C",
            "x": 12155.8583984375,
            "y": -71991.3203125,
            "z": 6010.48095703125
        });

  const setPosition = (data: PlayerPosition | null | undefined): void => {
    position.value = data ?? null;
  };

  return { position, setPosition };
});
