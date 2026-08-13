import { ref } from 'vue';

/**
 * Module-level reactive state shared by every component that needs to know
 * about the current application zoom level (DisplayControls writes, TheMap
 * reads to fix its touch-coordinate mapping under CSS zoom).
 */
export const ZOOM_STEP = 0.1;
export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 1.8;
export const ZOOM_KEY = 'skyrim-monitor-zoom';

function readStoredZoom(): number {
  try {
    const raw = localStorage.getItem(ZOOM_KEY);
    const parsed = raw === null ? NaN : parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 1;
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
    return 1;
  }
}

/** Singleton reactive zoom factor. Initialised from localStorage at module load. */
export const currentZoom = ref(readStoredZoom());

/** Persist the current zoom factor to localStorage. */
export function persistZoom(value: number): void {
  try {
    localStorage.setItem(ZOOM_KEY, String(value));
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}