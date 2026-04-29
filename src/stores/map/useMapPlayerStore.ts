import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlayerPosition } from './types';

/**
 * Holds the player's current position + heading. Updated at high frequency
 * by the game server, so the setter is intentionally minimal — no
 * normalization, no allocation beyond the ref write.
 */
export const useMapPlayerStore = defineStore('mapPlayer', () => {
  const position = ref<PlayerPosition | null>();

  const setPosition = (data: PlayerPosition | null | undefined): void => {
    position.value = data ?? null;
  };

  return { position, setPosition };
});
