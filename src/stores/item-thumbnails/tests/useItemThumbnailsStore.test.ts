import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { flushPromises } from '@vue/test-utils';

vi.mock('@/shared/lib/nif', () => ({
  isThumbnailRenderingSupported: () => true,
}));

const generateThumbnail = vi.fn<(...args: unknown[]) => Promise<string | null>>();
vi.mock('../lib/generateThumbnail', () => ({
  generateThumbnail: (...args: unknown[]) => generateThumbnail(...args),
}));

vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: () => ({
    isConnected: true,
    downloadFile: vi.fn(),
    texturePreview: vi.fn(),
  }),
}));

import { useItemThumbnailsStore, thumbnailKey } from '../useItemThumbnailsStore';
import { clearThumbnails } from '../lib/thumbnailDb';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { FEATURES } from '@/stores/system/lib/types';
import { persistItemThumbnailsDisabled } from '@/shared/lib/settings/itemThumbnailsPreference';

const DAGGER = {
  modelPath: 'meshes/weapons/steel/steeldagger.nif',
  keywords: ['WeapMaterialSteel'],
  framing: 'diagonal' as const,
};

describe('useItemThumbnailsStore', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    generateThumbnail.mockReset();
    persistItemThumbnailsDisabled(false);
    await clearThumbnails();
  });

  function enableFeatures(): void {
    useSystemStore().features = [FEATURES.INVENTORY_MODELS, FEATURES.FILE_DOWNLOAD];
  }

  it('builds a key from model, material and framing', () => {
    expect(thumbnailKey(DAGGER)).toBe('v3|meshes/weapons/steel/steeldagger.nif|steel|diagonal');
    expect(thumbnailKey({ ...DAGGER, modelPath: null })).toBeNull();
  });

  it('does nothing when the plugin does not provide models', async () => {
    const store = useItemThumbnailsStore();
    store.request(DAGGER);
    await flushPromises();
    expect(generateThumbnail).not.toHaveBeenCalled();
    expect(store.urlFor(DAGGER)).toBeNull();
  });

  it('renders once and caches the result', async () => {
    enableFeatures();
    generateThumbnail.mockResolvedValue('data:image/webp;base64,AAA');
    const store = useItemThumbnailsStore();

    store.request(DAGGER);
    store.request(DAGGER);
    await vi.waitFor(() => expect(store.urlFor(DAGGER)).toBe('data:image/webp;base64,AAA'));
    expect(generateThumbnail).toHaveBeenCalledTimes(1);

    // A fresh store (app restart) restores it from IndexedDB without rendering.
    setActivePinia(createPinia());
    enableFeatures();
    const restarted = useItemThumbnailsStore();
    restarted.request(DAGGER);
    await vi.waitFor(() => expect(restarted.urlFor(DAGGER)).toBe('data:image/webp;base64,AAA'));
    expect(generateThumbnail).toHaveBeenCalledTimes(1);
  });

  it('keeps the fallback icon after a failure and does not retry', async () => {
    enableFeatures();
    generateThumbnail.mockRejectedValue(new Error('Failed to open file'));
    const store = useItemThumbnailsStore();

    store.request(DAGGER);
    await vi.waitFor(() => expect(store.isProcessing).toBe(false));
    store.request(DAGGER);
    await flushPromises();
    expect(generateThumbnail).toHaveBeenCalledTimes(1);
    expect(store.urlFor(DAGGER)).toBeNull();
  });

  it('returns no URL while the preference is disabled', async () => {
    enableFeatures();
    generateThumbnail.mockResolvedValue('data:image/webp;base64,AAA');
    const store = useItemThumbnailsStore();
    store.request(DAGGER);
    await vi.waitFor(() => expect(store.urlFor(DAGGER)).not.toBeNull());

    persistItemThumbnailsDisabled(true);
    expect(store.urlFor(DAGGER)).toBeNull();
  });
});
