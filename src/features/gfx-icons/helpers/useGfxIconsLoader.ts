import { base64ToBytes, generateSvgByShapeId } from '@/shared/lib/gfx';
import { logger } from '@/shared/lib/utils/logger';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { readManifest, readSvg, writeManifest, writeSvg, clearAll } from './gfxStorage';
import { GFX_FILE_PATH } from '../config/gfxIcons';
import type { GfxIconsManifest } from '../lib/types';

// Shared in-flight promise so concurrent callers share one download.
let ensurePromise: Promise<void> | null = null;

export function useGfxIconsLoader() {
  const gfxIconsStore = useGfxIconsStore();
  const websocketStore = useWebSocketStore();

  /**
   * Restore the icon set from IndexedDB. Returns false when no valid,
   * complete cache exists.
   */
  async function hydrateFromStorage(): Promise<boolean> {
    const manifest = await readManifest();
    if (!manifest || !manifest.ready) return false;

    const restored: Record<number, string> = {};
    for (const shapeId of manifest.shapeIds) {
      const svg = await readSvg(shapeId);
      if (!svg) {
        console.warn(`[GfxIcons] Incomplete cache: missing shapeId ${shapeId}`);
        return false;
      }
      restored[shapeId] = svg;
    }

    gfxIconsStore.setIcons(restored);
    logger.log(`[GfxIcons] Hydrated ${manifest.shapeIds.length} icons from IndexedDB`);
    return true;
  }

  /**
   * Ensure the icon set is available. Runs as a background task and does not
   * depend on canAct: the file_download command bypasses the commands gate.
   */
  function ensureLoaded(): Promise<void> {
    if (gfxIconsStore.isReady) return Promise.resolve();
    if (ensurePromise) return ensurePromise;

    gfxIconsStore.isLoading = true;
    gfxIconsStore.error = null;

    const loadPromise = (async () => {
      try {
        if (await hydrateFromStorage()) return;

        const result = await websocketStore.downloadFile(GFX_FILE_PATH);
        const svgMap = await generateSvgByShapeId(base64ToBytes(result.dataBase64));

        const shapeIds: number[] = [];
        for (const [shapeIdText, svg] of Object.entries(svgMap)) {
          const shapeId = Number(shapeIdText);
          await writeSvg(shapeId, svg);
          shapeIds.push(shapeId);
        }

        const manifest: GfxIconsManifest = {
          ready: true,
          shapeCount: shapeIds.length,
          shapeIds,
          generatedAt: new Date().toISOString(),
        };
        await writeManifest(manifest);

        gfxIconsStore.setIcons(svgMap);
        logger.log(`[GfxIcons] Downloaded and cached ${shapeIds.length} icons`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        gfxIconsStore.error = message;
        console.error('[GfxIcons] Failed to load icons:', err);
      } finally {
        gfxIconsStore.isLoading = false;
      }
    })();

    // Reset the in-flight marker only after the promise settles. Resetting it
    // inside the async body runs before this outer assignment on the
    // synchronous hydrate path and would leave a stale resolved promise.
    ensurePromise = loadPromise.finally(() => {
      ensurePromise = null;
    });

    return ensurePromise;
  }

  /**
   * Clear the cached icon set and re-download everything from the server.
   * Safe to call at any time — waits for any in-flight load to settle first.
   */
  async function reinitialize(): Promise<void> {
    // Wait for any in-flight load to settle before resetting.
    if (ensurePromise) {
      try {
        await ensurePromise;
      } catch {
        // Ignore errors from the previous load.
      }
    }
    ensurePromise = null;
    gfxIconsStore.reset();
    await clearAll();
    await ensureLoaded();
  }

  return { ensureLoaded, reinitialize };
}
