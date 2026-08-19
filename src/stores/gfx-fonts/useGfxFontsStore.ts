import { defineStore } from 'pinia';
import { ref } from 'vue';
import { gfxFontsDisabled, persistGfxFontsDisabled } from '@/shared/lib/settings/gfxFontsPreference';

// Original font CSS var values for restoring
const ORIGINAL_FONT_HEADING = "'Cinzel', serif";
const ORIGINAL_FONT_BODY = "'Cormorant Garamond', serif";

export const useGfxFontsStore = defineStore('gfxFonts', () => {
  const isReady = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const activeFonts = ref<string[]>([]);
  /** Primary game font family used as the first entry of --font-heading/--font-body. */
  const primaryFontName = ref<string | null>(null);
  const useGameFonts = ref(!gfxFontsDisabled.value);

  function applyGameFonts(): void {
    const primary = primaryFontName.value;
    if (!primary) return;
    document.documentElement.style.setProperty(
      '--font-heading',
      `'${primary}', ${ORIGINAL_FONT_HEADING}`
    );
    document.documentElement.style.setProperty(
      '--font-body',
      `'${primary}', ${ORIGINAL_FONT_BODY}`
    );
  }

  function restoreOriginalFonts(): void {
    document.documentElement.style.setProperty('--font-heading', ORIGINAL_FONT_HEADING);
    document.documentElement.style.setProperty('--font-body', ORIGINAL_FONT_BODY);
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