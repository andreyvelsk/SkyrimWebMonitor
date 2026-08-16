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

describe('useGfxIconsLoader', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('hydrates from localStorage without downloading', async () => {
    localStorage.setItem(
      'gfx-icons:v1:manifest',
      JSON.stringify({
        ready: true,
        shapeCount: 1,
        shapeIds: [139],
        generatedAt: '2026-01-01T00:00:00.000Z',
      })
    );
    localStorage.setItem('gfx-icons:v1:svg:139', '<svg/>');

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
    expect(localStorage.getItem('gfx-icons:v1:svg:139')).toBe('<svg/>');
  });
});
