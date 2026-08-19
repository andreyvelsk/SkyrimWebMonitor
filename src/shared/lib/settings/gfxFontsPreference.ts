import { ref } from 'vue';

/** localStorage key for the "disable GFX fonts" preference. */
export const GFX_FONTS_DISABLED_KEY = 'skyrim-monitor-gfx-fonts-disabled';

function readStoredDisabled(): boolean {
  try {
    const raw = localStorage.getItem(GFX_FONTS_DISABLED_KEY);
    return raw === 'true';
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
    return false;
  }
}

/** Singleton reactive flag: when true, GFX fonts are disabled and standard fonts are used instead. */
export const gfxFontsDisabled = ref(readStoredDisabled());

/** Persist the preference to localStorage. */
export function persistGfxFontsDisabled(value: boolean): void {
  gfxFontsDisabled.value = value;
  try {
    localStorage.setItem(GFX_FONTS_DISABLED_KEY, String(value));
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}