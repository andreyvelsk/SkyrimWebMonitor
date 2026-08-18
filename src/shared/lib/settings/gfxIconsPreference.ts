import { ref } from 'vue';

/** localStorage key for the "disable GFX icons" preference. */
export const GFX_ICONS_DISABLED_KEY = 'skyrim-monitor-gfx-icons-disabled';

function readStoredDisabled(): boolean {
  try {
    const raw = localStorage.getItem(GFX_ICONS_DISABLED_KEY);
    return raw === 'true';
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
    return false;
  }
}

/** Singleton reactive flag: when true, GFX icons are disabled and standard icons are used instead. */
export const gfxIconsDisabled = ref(readStoredDisabled());

/** Persist the preference to localStorage. */
export function persistGfxIconsDisabled(value: boolean): void {
  gfxIconsDisabled.value = value;
  try {
    localStorage.setItem(GFX_ICONS_DISABLED_KEY, String(value));
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}