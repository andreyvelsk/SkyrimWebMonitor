import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { GameStatus } from './types';

export const useGameStatusStore = defineStore('gameStatus', () => {
  // Full server-provided status payload. `null` means we have not yet received any data.
  const status = ref<GameStatus | null>(null);

  const setStatus = (next: GameStatus): void => {
    status.value = { ...next };
  };

  const reset = (): void => {
    status.value = null;
  };

  // Convenience flags. While status is unknown we assume actions are allowed
  // so the UI is not blocked before the first push from the server.
  const canAct = computed<boolean>(() => status.value?.canAct ?? true);
  const paused = computed<boolean>(() => status.value?.paused ?? false);
  const loading = computed<boolean>(() => status.value?.loading ?? false);
  const inMainMenu = computed<boolean>(() => status.value?.inMainMenu ?? false);
  const inDialogue = computed<boolean>(() => status.value?.inDialogue ?? false);
  const inCombat = computed<boolean>(() => status.value?.inCombat ?? false);
  const dead = computed<boolean>(() => status.value?.dead ?? false);
  const controlsEnabled = computed<boolean>(() => status.value?.controlsEnabled ?? true);

  return {
    status,
    setStatus,
    reset,
    canAct,
    paused,
    loading,
    inMainMenu,
    inDialogue,
    inCombat,
    dead,
    controlsEnabled,
  };
});
