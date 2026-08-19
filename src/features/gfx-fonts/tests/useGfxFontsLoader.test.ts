import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const { downloadFileMock, decodeSwfInputMock, parseSwfFontsMock, convertFontToTTFMock } = vi.hoisted(() => ({
  downloadFileMock: vi.fn(),
  decodeSwfInputMock: vi.fn(),
  parseSwfFontsMock: vi.fn(),
  convertFontToTTFMock: vi.fn(() => new Uint8Array([0, 1, 2]).buffer),
}));

vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: () => ({ downloadFile: downloadFileMock }),
}));

vi.mock('@/shared/lib/fonts', () => ({
  decodeSwfInput: decodeSwfInputMock,
  parseSwfFonts: parseSwfFontsMock,
  convertFontToTTF: convertFontToTTFMock,
}));

import { useGfxFontsLoader } from '../helpers/useGfxFontsLoader';
import { useGfxFontsStore } from '@/stores/gfx-fonts/useGfxFontsStore';
import { writeManifest, writeFont, clearAll, readManifest } from '../helpers/gfxFontsStorage';
import { PRIMARY_FONT_NAME } from '../config/gfxFonts';
import type { GfxFont } from '@/shared/lib/fonts/types';

describe('useGfxFontsLoader', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearAll();
    vi.clearAllMocks();

    // Ensure happy-dom has a document.head available
    if (!document.head) {
      const head = document.createElement('head');
      document.documentElement.appendChild(head);
    }
  });

  it('hydrates from IndexedDB without downloading', async () => {
    const ttfBase64 = 'AAEAAAABAIAAAwB...';
    await writeFont(PRIMARY_FONT_NAME, ttfBase64);
    await writeManifest({
      ready: true,
      fontNames: [PRIMARY_FONT_NAME],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });

    const { ensureLoaded } = useGfxFontsLoader();
    await ensureLoaded();

    const store = useGfxFontsStore();
    expect(store.isReady).toBe(true);
    expect(store.activeFonts).toEqual([PRIMARY_FONT_NAME]);
    expect(downloadFileMock).not.toHaveBeenCalled();
  });

  it('downloads and caches when no manifest exists', async () => {
    const swfFont: GfxFont = {
      fontId: 1,
      code: 0,
      fontName: PRIMARY_FONT_NAME,
      fontFlags: 0,
      language: 0,
      hasLayout: true,
      wideOffsets: false,
      numGlyphs: 1,
      glyphs: [{ index: 0, code: 65, edges: [], segments: [], svgPath: 'M0,0' }],
      layout: null,
      dataStart: 0,
      tagLen: 0,
    };

    downloadFileMock.mockResolvedValue({ mimeType: 'x-shockwave-flash', size: 1, dataBase64: 'b64' });
    decodeSwfInputMock.mockReturnValue(new Uint8Array([1, 2, 3]));
    parseSwfFontsMock.mockReturnValue([swfFont]);

    const { ensureLoaded } = useGfxFontsLoader();
    await ensureLoaded();

    const store = useGfxFontsStore();
    expect(store.isReady).toBe(true);
    expect(downloadFileMock).toHaveBeenCalledWith('interface/fonts_en.swf');
    expect(decodeSwfInputMock).toHaveBeenCalledWith('b64');
    expect(parseSwfFontsMock).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]));
    expect(convertFontToTTFMock).toHaveBeenCalledWith(swfFont);

    // Manifest should have been written
    const manifest = await readManifest();
    expect(manifest).not.toBeNull();
    if (manifest) {
      expect(manifest.fontNames).toContain(PRIMARY_FONT_NAME);
    }

    // Font should have been cached in IndexedDB
    const cached = await import('../helpers/gfxFontsDb').then(m => m.readFont(PRIMARY_FONT_NAME));
    expect(cached).not.toBeNull();
  });

  it('reinitialize clears cache and re-downloads', async () => {
    // Seed the cache first
    await writeFont(PRIMARY_FONT_NAME, 'base64-old');
    await writeManifest({
      ready: true,
      fontNames: [PRIMARY_FONT_NAME],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });

    const swfFont: GfxFont = {
      fontId: 2,
      code: 0,
      fontName: PRIMARY_FONT_NAME,
      fontFlags: 0,
      language: 0,
      hasLayout: true,
      wideOffsets: false,
      numGlyphs: 1,
      glyphs: [{ index: 0, code: 65, edges: [], segments: [], svgPath: 'M10,10' }],
      layout: null,
      dataStart: 0,
      tagLen: 0,
    };

    downloadFileMock.mockResolvedValue({ mimeType: 'x-shockwave-flash', size: 1, dataBase64: 'b64' });
    decodeSwfInputMock.mockReturnValue(new Uint8Array([1, 2, 3]));
    parseSwfFontsMock.mockReturnValue([swfFont]);

    const { reinitialize } = useGfxFontsLoader();
    await reinitialize();

    const store = useGfxFontsStore();
    expect(store.isReady).toBe(true);
    expect(downloadFileMock).toHaveBeenCalledTimes(1);
    expect(downloadFileMock).toHaveBeenCalledWith('interface/fonts_en.swf');

    // Old cache should be gone, new font cached
    const cached = await import('../helpers/gfxFontsDb').then(m => m.readFont(PRIMARY_FONT_NAME));
    expect(cached).not.toBe('base64-old');
  });

  it('loads RU font file when navigator.language starts with ru', async () => {
    // Temporarily override navigator.language
    const originalLanguage = Object.getOwnPropertyDescriptor(navigator, 'language');

    Object.defineProperty(navigator, 'language', {
      value: 'ru-RU',
      configurable: true,
    });

    downloadFileMock.mockResolvedValue({ mimeType: 'x-shockwave-flash', size: 1, dataBase64: 'b64' });
    decodeSwfInputMock.mockReturnValue(new Uint8Array([]));
    parseSwfFontsMock.mockReturnValue([]);

    const { ensureLoaded } = useGfxFontsLoader();
    await ensureLoaded();

    expect(downloadFileMock).toHaveBeenCalledWith('interface/fonts_ru.swf');

    // Restore
    if (originalLanguage) {
      Object.defineProperty(navigator, 'language', originalLanguage);
    }
  });

  it('sets store error when download fails', async () => {
    downloadFileMock.mockRejectedValue(new Error('Network error'));

    const { ensureLoaded } = useGfxFontsLoader();
    await ensureLoaded();

    const store = useGfxFontsStore();
    expect(store.isReady).toBe(false);
    expect(store.isLoading).toBe(false);
    expect(store.error).toBe('Network error');
  });
});