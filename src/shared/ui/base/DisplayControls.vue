<template>
  <!-- Teleport to body so position:fixed works outside any zoom context -->
  <Teleport to="body">
    <div class="display-controls">
      <button
        class="display-controls__btn"
        type="button"
        title="Zoom out"
        @click="zoomOut"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="10"
            cy="10"
            r="6"
          />
          <line
            x1="14.5"
            y1="14.5"
            x2="20"
            y2="20"
          />
          <line
            x1="7"
            y1="10"
            x2="13"
            y2="10"
          />
        </svg>
      </button>

      <button
        class="display-controls__btn"
        type="button"
        :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        @click="toggleFullscreen"
      >
        <svg
          v-if="!isFullscreen"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </svg>
        <svg
          v-else
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 3v3a2 2 0 0 1-2 2H3" />
          <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
          <path d="M3 16h3a2 2 0 0 1 2 2v3" />
          <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
        </svg>
      </button>

      <button
        class="display-controls__btn"
        type="button"
        title="Zoom in"
        @click="zoomIn"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle
            cx="10"
            cy="10"
            r="6"
          />
          <line
            x1="14.5"
            y1="14.5"
            x2="20"
            y2="20"
          />
          <line
            x1="10"
            y1="7"
            x2="10"
            y2="13"
          />
          <line
            x1="7"
            y1="10"
            x2="13"
            y2="10"
          />
        </svg>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import {
  currentZoom,
  ZOOM_STEP,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_KEY,
  persistZoom,
} from '@/shared/lib/composables/useAppZoom';

interface ElectronAPI {
  setZoom: (_factor: number) => void;
  toggleFullscreen: () => void;
  getFullscreenState: () => Promise<boolean>;
  onFullscreenChange: (_cb: (_isFullscreen: boolean) => void) => () => void;
}

function isElectron(): boolean {
  return typeof window !== 'undefined' && 'electronAPI' in window;
}

function getElectronAPI(): ElectronAPI {
  // Cast through unknown: electronAPI is injected by preload at runtime.
  return (window as unknown as { electronAPI: ElectronAPI }).electronAPI;
}

const isFullscreen = ref(false);

function applyZoom(value: number): void {
  currentZoom.value = Math.round(value * 10) / 10;
  if (isElectron()) {
    // Electron: native zoom — identical to Ctrl+/-.
    getElectronAPI().setZoom(currentZoom.value);
  } else {
    const z = currentZoom.value;
    // Clear any previously set html-level overrides from old approach.
    document.documentElement.style.zoom = '';
    document.documentElement.style.height = '';
    // Zoom the app container and compensate its height so the content
    // always fills exactly the viewport: height(vh) × zoom = 100vh.
    // e.g. zoom 1.5 → height 66.67vh → rendered 66.67 × 1.5 = 100vh. ✓
    const appContainer = document.querySelector<HTMLElement>('.handheld-device');
    if (appContainer) {
      if (z !== 1) {
        appContainer.style.zoom = String(z);
        appContainer.style.height = `${(100 / z).toFixed(4)}vh`;
      } else {
        appContainer.style.zoom = '';
        appContainer.style.height = '';
      }
    }
  }
  persistZoom(currentZoom.value);
}

function zoomIn(): void {
  applyZoom(Math.min(currentZoom.value + ZOOM_STEP, ZOOM_MAX));
}

function zoomOut(): void {
  applyZoom(Math.max(currentZoom.value - ZOOM_STEP, ZOOM_MIN));
}

function toggleFullscreen(): void {
  if (isElectron()) {
    // Electron: OS-level fullscreen via IPC (same as F11)
    getElectronAPI().toggleFullscreen();
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

function onFullscreenChange(): void {
  isFullscreen.value = !!document.fullscreenElement;
}

let removeElectronFsListener: (() => void) | null = null;

onMounted(() => {
  // Restore zoom from previous session
  const saved = localStorage.getItem(ZOOM_KEY);
  if (saved) {
    applyZoom(parseFloat(saved));
  }

  if (isElectron()) {
    const api = getElectronAPI();
    // Sync initial state from main process (handles --fullscreen launch flag)
    api.getFullscreenState().then((isFs) => {
      isFullscreen.value = isFs;
    });
    // Track OS fullscreen changes via IPC
    removeElectronFsListener = api.onFullscreenChange((isFs) => {
      isFullscreen.value = isFs;
    });
  } else {
    isFullscreen.value = !!document.fullscreenElement;
    document.addEventListener('fullscreenchange', onFullscreenChange);
  }
});

onUnmounted(() => {
  if (removeElectronFsListener) {
    removeElectronFsListener();
    removeElectronFsListener = null;
  } else {
    document.removeEventListener('fullscreenchange', onFullscreenChange);
  }
});
</script>

<style scoped lang="scss">
.display-controls {
  position: fixed;
  bottom: var(--spacing-md);
  right: var(--spacing-md);
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  z-index: 100;
}

.display-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 6px;
  background: rgb(0 0 0 / 0.3);
  color: rgb(255 255 255 / 0.35);
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;

  svg {
    width: 1.1rem;
    height: 1.1rem;
    pointer-events: none;
  }

  &:hover {
    background: rgb(0 0 0 / 0.5);
    border-color: rgb(255 255 255 / 0.2);
    color: rgb(255 255 255 / 0.65);
  }

  &:active {
    background: rgb(255 255 255 / 0.08);
  }
}
</style>
