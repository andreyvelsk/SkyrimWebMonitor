import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const { downloadFileMock, base64ToBytesMock, generateSvgByShapeIdMock } = vi.hoisted(() => ({
  downloadFileMock: vi.fn(),
  base64ToBytesMock: vi.fn(),
  generateSvgByShapeIdMock: vi.fn(),
}));

vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: () => ({ downloadFile: downloadFileMock }),
}));

vi.mock('@/shared/lib/gfx', () => ({
  base64ToBytes: base64ToBytesMock,
  generateSvgByShapeId: generateSvgByShapeIdMock,
}));

import { useGfxIconsLoader } from '@/features/gfx-icons/helpers/useGfxIconsLoader';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { writeManifest, writeSvg, clearAll, readManifest } from '@/features/gfx-icons/helpers/gfxStorage';

describe('useGfxIconsLoader', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await clearAll();
    vi.clearAllMocks();
  });

  it('hydrates from IndexedDB without downloading', async () => {
    await writeSvg(139, '<svg/>');
    await writeManifest({
      ready: true,
      shapeCount: 1,
      shapeIds: [139],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });

    const { ensureLoaded } = useGfxIconsLoader();
    await ensureLoaded();

    const store = useGfxIconsStore();
    expect(store.isReady).toBe(true);
    expect(store.svgByShapeId[139]).toBe('<svg/>');
    expect(downloadFileMock).not.toHaveBeenCalled();
  });

  it('downloads and caches when no manifest exists', async () => {
    downloadFileMock.mockResolvedValue({ mimeType: 'x', size: 1, dataBase64: 'b64' });
    base64ToBytesMock.mockReturnValue(new Uint8Array([1]));
    generateSvgByShapeIdMock.mockResolvedValue({ 139: '<svg/>' });

    const { ensureLoaded } = useGfxIconsLoader();
    await ensureLoaded();

    const store = useGfxIconsStore();
    expect(store.isReady).toBe(true);
    expect(downloadFileMock).toHaveBeenCalledWith('interface/exported/hudmenu.gfx');
    expect(await readManifest()).not.toBeNull();
  });

  it('reinitialize clears cache and re-downloads', async () => {
    // First, seed the cache.
    await writeSvg(139, '<svg-old/>');
    await writeManifest({
      ready: true,
      shapeCount: 1,
      shapeIds: [139],
      generatedAt: '2026-01-01T00:00:00.000Z',
    });

    // Set up the mock for the re-download.
    downloadFileMock.mockResolvedValue({ mimeType: 'x', size: 1, dataBase64: 'b64' });
    base64ToBytesMock.mockReturnValue(new Uint8Array([1]));
    generateSvgByShapeIdMock.mockResolvedValue({ 711: '<svg-new/>' });

    const { reinitialize } = useGfxIconsLoader();
    await reinitialize();

    const store = useGfxIconsStore();
    expect(store.isReady).toBe(true);
    // Old icon should be gone, new icon should be present.
    expect(store.svgByShapeId[139]).toBeUndefined();
    expect(store.svgByShapeId[711]).toBe('<svg-new/>');
    expect(downloadFileMock).toHaveBeenCalledTimes(1);
  });
});
