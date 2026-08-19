import { decodeSwfInput, parseSwfFonts, convertFontToTTF } from '@/shared/lib/fonts';
import { logger } from '@/shared/lib/utils/logger';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useGfxFontsStore } from '@/stores/gfx-fonts/useGfxFontsStore';
import { readManifest, readFont, writeManifest, writeFont, clearAll } from './gfxFontsStorage';
import { FONTS_FILE_PATH_RU, FONTS_FILE_PATH_EN, PRIMARY_FONT_NAME } from '../config/gfxFonts';
import type { GfxFontsManifest } from '../lib/types';

let ensurePromise: Promise<void> | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function injectFontFace(fontName: string, ttfBase64: string): void {
  const css = `@font-face {
    font-family: '${fontName}';
    src: url('data:font/ttf;base64,${ttfBase64}') format('truetype');
    font-display: swap;
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  style.dataset.fontName = `gfx-font-${fontName}`;
  document.head.appendChild(style);
}

function getLocale(): 'ru' | 'en' {
  try {
    const locale = navigator.language || 'en';
    return locale.startsWith('ru') ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}

function getFontFilePath(): string {
  return getLocale() === 'ru' ? FONTS_FILE_PATH_RU : FONTS_FILE_PATH_EN;
}

export function useGfxFontsLoader() {
  const gfxFontsStore = useGfxFontsStore();
  const websocketStore = useWebSocketStore();

  async function hydrateFromStorage(): Promise<boolean> {
    const manifest = await readManifest();
    if (!manifest || !manifest.ready) return false;

    // Verify primary font exists in cache
    const primaryTtf = await readFont(PRIMARY_FONT_NAME);
    if (!primaryTtf) return false;

    // Inject all cached fonts
    for (const fontName of manifest.fontNames) {
      const ttfBase64 = await readFont(fontName);
      if (ttfBase64) {
        injectFontFace(fontName, ttfBase64);
      }
    }

    gfxFontsStore.setFontsLoaded(manifest.fontNames, PRIMARY_FONT_NAME);
    logger.log(`[GfxFonts] Hydrated ${manifest.fontNames.length} fonts from IndexedDB`);
    return true;
  }

  function ensureLoaded(): Promise<void> {
    if (gfxFontsStore.isReady) return Promise.resolve();
    if (ensurePromise) return ensurePromise;

    gfxFontsStore.isLoading = true;
    gfxFontsStore.error = null;

    const loadPromise = (async () => {
      try {
        if (await hydrateFromStorage()) return;

        const filePath = getFontFilePath();
        const result = await websocketStore.downloadFile(filePath);
        const swfBody = await decodeSwfInput(result.dataBase64);
        const fonts = parseSwfFonts(swfBody);

        const fontNames: string[] = [];
        for (const font of fonts) {
          // Only include fonts with valid paths
          const hasValidGlyphs = font.glyphs.some(g => g.svgPath && g.svgPath.length > 0);
          if (!hasValidGlyphs) continue;

          const ttfBuffer = convertFontToTTF(font);
          const ttfBase64 = arrayBufferToBase64(ttfBuffer);

          await writeFont(font.fontName, ttfBase64);
          injectFontFace(font.fontName, ttfBase64);
          fontNames.push(font.fontName);
        }

        const manifest: GfxFontsManifest = {
          ready: true,
          fontNames,
          generatedAt: new Date().toISOString(),
        };
        await writeManifest(manifest);

        gfxFontsStore.setFontsLoaded(fontNames, PRIMARY_FONT_NAME);
        logger.log(`[GfxFonts] Downloaded and cached ${fontNames.length} fonts`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        gfxFontsStore.error = message;
        console.error('[GfxFonts] Failed to load fonts:', err);
      } finally {
        gfxFontsStore.isLoading = false;
      }
    })();

    ensurePromise = loadPromise.finally(() => {
      ensurePromise = null;
    });

    return ensurePromise;
  }

  async function reinitialize(): Promise<void> {
    if (ensurePromise) {
      try { await ensurePromise; } catch (err) {
        console.warn('[GfxFonts] In-flight load failed during reinitialize, ignoring', err);
      }
    }
    ensurePromise = null;
    gfxFontsStore.reset();

    // Remove injected @font-face styles
    const styles = document.querySelectorAll('style[data-font-name^="gfx-font-"]');
    styles.forEach(s => s.remove());

    await clearAll();
    await ensureLoaded();
  }

  return { ensureLoaded, reinitialize };
}