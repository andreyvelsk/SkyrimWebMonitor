import { defineStore } from 'pinia';
import { ref } from 'vue';
import { gfxFontsDisabled, persistGfxFontsDisabled } from '@/shared/lib/settings/gfxFontsPreference';

/** CSS class added to <html> when game fonts are active. */
const CSS_CLASS_ENABLED = 'gfx-fonts-enabled';
/** CSS class added to <html> when game fonts are disabled. */
const CSS_CLASS_DISABLED = 'gfx-fonts-disabled';

function setRootClass(useGame: boolean): void {
  const root = document.documentElement;
  root.classList.toggle(CSS_CLASS_ENABLED, useGame);
  root.classList.toggle(CSS_CLASS_DISABLED, !useGame);
}

export const useGfxFontsStore = defineStore('gfxFonts', () => {
  const isReady = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeFonts = ref<string[]>([]);
  /** Primary game font family used as the first entry of --font-heading/--font-body. */
  const primaryFontName = ref<string | null>(null);
  const useGameFonts = ref(!gfxFontsDisabled.value);

  function applyGameFonts(): void {
    setRootClass(true);
  }

  function restoreOriginalFonts(): void {
    setRootClass(false);
  }

  function setFontsLoaded(fontNames: string[], primary: string): void {
    activeFonts.value = fontNames;
    primaryFontName.value = primary;
    isReady.value = true;
    if (useGameFonts.value) {
      applyGameFonts();
    }
  }

  function updateUseGameFonts(value: boolean): void {
    useGameFonts.value = value;
    persistGfxFontsDisabled(!value);
    if (value && isReady.value && primaryFontName.value) {
      applyGameFonts();
    } else {
      restoreOriginalFonts();
    }
  }

  function reset(): void {
    isReady.value = false;
    isLoading.value = false;
    error.value = null;
    activeFonts.value = [];
    primaryFontName.value = null;
    restoreOriginalFonts();
  }

  return {
    isReady, isLoading, error, activeFonts, useGameFonts,
    setFontsLoaded, updateUseGameFonts, reset,
  };
});