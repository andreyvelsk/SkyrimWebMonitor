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

/** Singleton reactive zoom factor. Initialised from localStorage at module load. */
export const currentZoom = ref(parseFloat(localStorage.getItem(ZOOM_KEY) ?? '1'));

/** Persist the current zoom factor to localStorage. */
export function persistZoom(value: number): void {
  localStorage.setItem(ZOOM_KEY, String(value));
}