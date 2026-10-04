/**
 * 3D item thumbnails for weapons and apparel.
 *
 * `request()` is cheap and idempotent: components call it when an item row
 * becomes visible. Work runs one job at a time, newest request first (what
 * the user is looking at now), and each result is cached in memory and in
 * IndexedDB. Anything that fails keeps the tinted category icon.
 */
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { isThumbnailRenderingSupported, type ThumbnailFraming } from '@/shared/lib/nif';
import { itemThumbnailsDisabled } from '@/shared/lib/settings/itemThumbnailsPreference';
import { getItemMaterial } from '@/shared/lib/constants/itemMaterials';
import { logger } from '@/shared/lib/utils/logger';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { FEATURES } from '@/stores/system/lib/types';
import { getItemFraming } from '@/shared/lib/utils/itemVisual';
import type { InventoryItem } from '@/stores/inventory/lib/types';
import { generateThumbnail, type ThumbnailJob } from './lib/generateThumbnail';
import { clearThumbnails, readThumbnail, writeThumbnail } from './lib/thumbnailDb';

/** Bump when the renderer's look changes so old cached images are replaced. */
export const THUMBNAIL_RENDER_VERSION = 3;

export interface ThumbnailSource {
  modelPath?: string | null;
  keywords?: readonly string[] | null;
  framing: ThumbnailFraming;
}

export function thumbnailKey(source: ThumbnailSource): string | null {
  if (!source.modelPath) return null;
  const material = getItemMaterial(source.keywords);
  return `v${THUMBNAIL_RENDER_VERSION}|${source.modelPath}|${material.id}|${source.framing}`;
}

const PREFETCH_FIELDS: Record<string, string> = {
  weapons: 'Inventory::Items::Weapons',
  ammo: 'Inventory::Items::Ammo',
  apparel: 'Inventory::Items::Apparel',
  food: 'Inventory::Items::Food',
  potions: 'Inventory::Items::Potions',
  ingredients: 'Inventory::Items::Ingredients',
  scrolls: 'Inventory::Items::Scrolls',
  keys: 'Inventory::Items::Keys',
  books: 'Inventory::Items::Books',
  misc: 'Inventory::Items::Misc',
  gems: 'Inventory::Items::SoulGems',
};

const PREFETCH_TIMEOUT_MS = 15000;

type PrefetchItem = Pick<InventoryItem, 'categoryType' | 'keywords'> & { modelPath: string };

function isPrefetchItem(value: unknown): value is PrefetchItem {
  if (typeof value !== 'object' || value === null) return false;
  const modelPath: unknown = Reflect.get(value, 'modelPath');
  const categoryType: unknown = Reflect.get(value, 'categoryType');
  return typeof modelPath === 'string' && modelPath.length > 0 && typeof categoryType === 'string';
}

export const useItemThumbnailsStore = defineStore('itemThumbnails', () => {
  /** key → data URL. */
  const urls = reactive(new Map<string, string>());
  /** Keys currently queued or rendering (for spinners). */
  const pending = reactive(new Set<string>());
  const failed = new Set<string>();
  const queued = new Map<string, ThumbnailJob>();
  const order: string[] = [];
  const textureCache = new Map<string, Promise<HTMLImageElement | null>>();
  const isProcessing = ref(false);
  const generatedCount = ref(0);

  let renderSupported: boolean | null = null;

  function canRender(): boolean {
    if (itemThumbnailsDisabled.value) return false;
    const system = useSystemStore();
    if (!system.isFeatureProvided(FEATURES.INVENTORY_MODELS)) return false;
    if (!system.isFeatureProvided(FEATURES.FILE_DOWNLOAD)) return false;
    if (renderSupported === null) renderSupported = isThumbnailRenderingSupported();
    return renderSupported;
  }

  /** Current URL for this item, or null (fallback icon) while pending/failed. */
  function urlFor(source: ThumbnailSource): string | null {
    if (itemThumbnailsDisabled.value) return null;
    const key = thumbnailKey(source);
    return key ? (urls.get(key) ?? null) : null;
  }

  /**
   * Queue a thumbnail. `visible` jumps ahead of everything (what the user is
   * looking at now); `background` waits behind all other work, so the whole
   * inventory gets rendered and cached once without slowing the screen.
   */
  function request(source: ThumbnailSource, priority: 'visible' | 'background' = 'visible'): void {
    const key = thumbnailKey(source);
    if (!key || !source.modelPath) return;
    if (urls.has(key) || failed.has(key)) return;
    if (!canRender()) return;

    pending.add(key);
    const alreadyQueued = queued.has(key);
    if (!alreadyQueued) {
      queued.set(key, {
        modelPath: source.modelPath,
        tint: getItemMaterial(source.keywords).rgb,
        framing: source.framing,
      });
    }

    if (priority === 'background') {
      if (!alreadyQueued) order.unshift(key); // processed last (queue pops from the end)
    } else {
      if (alreadyQueued) {
        const index = order.indexOf(key);
        if (index >= 0) order.splice(index, 1);
      }
      order.push(key);
    }
    void processQueue();
  }

  /** Number of thumbnails still waiting (for progress display). */
  const pendingCount = computed(() => {
    void generatedCount.value; // re-evaluate as work completes
    return queued.size;
  });

  async function processQueue(): Promise<void> {
    if (isProcessing.value) return;
    isProcessing.value = true;
    const websocket = useWebSocketStore();
    const system = useSystemStore();

    try {
      for (let key = order.pop(); key !== undefined; key = order.pop()) {
        // newest request first
        const job = queued.get(key);
        queued.delete(key);
        if (!job || urls.has(key) || failed.has(key)) {
          pending.delete(key);
          continue;
        }

        const cached = await readThumbnail(key);
        if (cached) {
          urls.set(key, cached);
          pending.delete(key);
          continue;
        }

        if (!websocket.isConnected) {
          // Keep it for later; stop until the next request after reconnect.
          queued.set(key, job);
          order.unshift(key);
          break;
        }

        try {
          const url = await generateThumbnail(job, {
            downloadFile: websocket.downloadFile,
            texturePreview: system.isFeatureProvided(FEATURES.TEXTURE_PREVIEW_MAX_SIZE)
              ? websocket.texturePreview
              : null,
            textureCache,
          });
          if (url) {
            urls.set(key, url);
            generatedCount.value++;
            await writeThumbnail(key, url);
          } else {
            failed.add(key);
          }
          pending.delete(key);
        } catch (err) {
          failed.add(key);
          pending.delete(key);
          logger.log(`[ItemThumbnails] ${job.modelPath}: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Yield to the UI between renders.
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    } finally {
      isProcessing.value = false;
      // A request may have arrived while the last job was finishing.
      if (order.length > 0) void processQueue();
    }
  }

  // Resume the queue when the connection comes back: a stalled queue is not
  // re-triggered by request(), because already-queued keys short-circuit there.
  const websocketStore = useWebSocketStore();
  watch(
    () => websocketStore.isConnected,
    (connected) => {
      if (connected && order.length > 0) void processQueue();
    },
  );

  /**
   * One query for every inventory category, then queue each item with a
   * model as background work. Items already cached are skipped by request().
   * Resolves with the number of items that have a model.
   */
  function prefetchInventory(): Promise<number> {
    const websocket = useWebSocketStore();
    if (!websocket.isConnected || !canRender()) return Promise.resolve(0);
    return new Promise((resolve) => {
      // Older plugins may not answer; do not leave the caller waiting forever.
      const timeout = setTimeout(() => resolve(0), PREFETCH_TIMEOUT_MS);
      websocket.sendQuery(`thumbnails.prefetch.${String(Date.now())}`, PREFETCH_FIELDS, (fields) => {
        clearTimeout(timeout);
        let count = 0;
        for (const value of Object.values(fields)) {
          if (!Array.isArray(value)) continue;
          for (const raw of value) {
            if (!isPrefetchItem(raw)) continue;
            count++;
            request(
              { modelPath: raw.modelPath, keywords: raw.keywords, framing: getItemFraming(raw) },
              'background',
            );
          }
        }
        resolve(count);
      });
    });
  }

  /** Drop every cached thumbnail (memory + IndexedDB); they re-render on demand. */
  /** True while this item's thumbnail is queued or rendering. */
  function isPending(source: ThumbnailSource): boolean {
    const key = thumbnailKey(source);
    return key ? pending.has(key) : false;
  }

  async function clearCache(): Promise<void> {
    urls.clear();
    pending.clear();
    failed.clear();
    queued.clear();
    order.length = 0;
    textureCache.clear();
    generatedCount.value = 0;
    await clearThumbnails();
  }

  return {
    urls,
    isProcessing,
    generatedCount,
    pendingCount,
    urlFor,
    isPending,
    request,
    prefetchInventory,
    clearCache,
  };
});
