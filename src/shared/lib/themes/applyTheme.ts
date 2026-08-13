import { ref } from 'vue';
import { THEME_GAMUTS, DEFAULT_THEME_GAMUT_ID } from './gamuts';

/** localStorage key used to persist the selected theme gamut. */
export const THEME_GAMUT_KEY = 'skyrim-monitor-theme-gamut';

/** Attribute set on <html> that switches the active CSS variable gamut. */
export const THEME_GAMUT_ATTRIBUTE = 'data-theme-gamut';

function isKnownGamutId(id: string): boolean {
  return THEME_GAMUTS.some((gamut) => gamut.id === id);
}

function readStoredGamutId(): string {
  try {
    const raw = localStorage.getItem(THEME_GAMUT_KEY);
    return raw !== null && isKnownGamutId(raw) ? raw : DEFAULT_THEME_GAMUT_ID;
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
    return DEFAULT_THEME_GAMUT_ID;
  }
}

/** Singleton reactive id of the active theme gamut. */
export const currentThemeGamutId = ref(readStoredGamutId());

/** Apply a gamut to <html> and persist the choice. */
export function applyThemeGamut(id: string): void {
  const nextId = isKnownGamutId(id) ? id : DEFAULT_THEME_GAMUT_ID;
  currentThemeGamutId.value = nextId;

  const root = document.documentElement;
  if (nextId === DEFAULT_THEME_GAMUT_ID) {
    root.removeAttribute(THEME_GAMUT_ATTRIBUTE);
  } else {
    root.setAttribute(THEME_GAMUT_ATTRIBUTE, nextId);
  }

  try {
    localStorage.setItem(THEME_GAMUT_KEY, nextId);
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}

/** Restore the persisted gamut on startup (call before app mount). */
export function initThemeGamut(): void {
  applyThemeGamut(currentThemeGamutId.value);
}