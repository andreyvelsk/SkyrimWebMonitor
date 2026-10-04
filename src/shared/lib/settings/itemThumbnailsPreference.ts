import { ref } from 'vue';

/** localStorage key for the "disable 3D item thumbnails" preference. */
export const ITEM_THUMBNAILS_DISABLED_KEY = 'skyrim-monitor-item-thumbnails-disabled';

function readStoredDisabled(): boolean {
  try {
    return localStorage.getItem(ITEM_THUMBNAILS_DISABLED_KEY) === 'true';
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
    return false;
  }
}

/**
 * Singleton reactive flag: when true, weapons and apparel keep their tinted
 * category icons instead of 3D thumbnails rendered from the game models.
 */
export const itemThumbnailsDisabled = ref(readStoredDisabled());

/** Persist the preference to localStorage. */
export function persistItemThumbnailsDisabled(value: boolean): void {
  itemThumbnailsDisabled.value = value;
  try {
    localStorage.setItem(ITEM_THUMBNAILS_DISABLED_KEY, String(value));
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}
