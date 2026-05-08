import { ref } from 'vue';

export const MAP_DZI_URL = `${import.meta.env.BASE_URL}map-dzi/skyrim.dzi`;
const MAP_TILES_MANIFEST_URL = `${import.meta.env.BASE_URL}map-tiles/manifest.json`;
const MAP_DZI_INFO_STORAGE_KEY = 'map-dzi-info-v1';
const MAP_TILE_CACHE_NAME = 'map-dzi-tiles';

export interface MapTilesManifest {
  width: number;
  height: number;
  tileSize: number;
  cols: number;
  rows: number;
  format: 'webp' | 'jpg' | 'png';
  basePath: string;
}

function normalizeTilesBasePath(rawBasePath: string): string {
  const trimmed = rawBasePath.trim();
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Keep absolute external URLs untouched.
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  // App-base-relative path. This also fixes old manifests that used '/map-tiles'
  // while the app itself is served from a non-root BASE_URL.
  const rel = trimmed.replace(/^\/+/, '');
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const joined = `${base}${rel}`;

  return joined.endsWith('/') ? joined.slice(0, -1) : joined;
}

let tilesManifestPromise: Promise<MapTilesManifest | null> | null = null;

function toPositiveInt(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  const n = Math.floor(v);
  return n > 0 ? n : null;
}

/**
 * Loads optional tile manifest from /public/map-tiles/manifest.json.
 * If absent or invalid, returns null and the map falls back to single-image mode.
 */
export async function loadMapTilesManifest(): Promise<MapTilesManifest | null> {
  if (tilesManifestPromise) return tilesManifestPromise;

  tilesManifestPromise = (async () => {
    try {
      const res = await fetch(MAP_TILES_MANIFEST_URL, { cache: 'force-cache' });
      if (!res.ok) return null;
      const data = await res.json() as Record<string, unknown>;

      const width = toPositiveInt(data.width);
      const height = toPositiveInt(data.height);
      const tileSize = toPositiveInt(data.tileSize);

      const formatRaw = typeof data.format === 'string' ? data.format.toLowerCase() : '';
      const format = formatRaw === 'webp' || formatRaw === 'jpg' || formatRaw === 'png'
        ? formatRaw
        : null;

      if (!width || !height || !tileSize || !format) return null;

      const cols = Math.ceil(width / tileSize);
      const rows = Math.ceil(height / tileSize);

      const basePathRaw = typeof data.basePath === 'string'
        ? data.basePath
        : 'map-tiles';
      const basePath = normalizeTilesBasePath(basePathRaw);

      return {
        width,
        height,
        tileSize,
        cols,
        rows,
        format,
        basePath,
      };
    } catch {
      return null;
    }
  })();

  return tilesManifestPromise;
}

/**
 * Tile naming convention: {basePath}/{row}-{col}.{format}
 * Example: /map-tiles/3-5.webp
 */
export function buildMapTileUrl(manifest: MapTilesManifest, row: number, col: number): string {
  return `${manifest.basePath}/${row}-${col}.${manifest.format}`;
}

// =============================================================
// Background DZI tile prefetch
// =============================================================

/**
 * Shared cache of `realTileUrl -> blob:URL`. Populated in the background by
 * `prefetchMapTiles()` and consumed by `TheMap.vue` via a patched
 * `source.getTileUrl` so OpenSeadragon serves tiles from memory after the
 * prefetch completes.
 */
export const mapTileBlobUrls = new Map<string, string>();

/** Reactive prefetch state, mirrored by the Map page UI for the backdrop. */
export const mapTilesPrefetchActive = ref(false);
/** 0..100 — overall completion of the background tile prefetch. */
export const mapTilesPrefetchProgress = ref(0);

let prefetchTilesPromise: Promise<void> | null = null;
const PREFETCH_CONCURRENCY = 12;

interface DziInfo {
  width: number;
  height: number;
  tileSize: number;
  overlap: number;
  format: string;
  /** Base URL of the per-level tile folders (no trailing slash). */
  tilesBase: string;
}

function saveDziInfo(info: DziInfo): void {
  try {
    localStorage.setItem(MAP_DZI_INFO_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // Best-effort persistence only.
  }
}

function loadDziInfoFromStorage(): DziInfo | null {
  try {
    const raw = localStorage.getItem(MAP_DZI_INFO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DziInfo>;
    if (
      !parsed ||
      typeof parsed.width !== 'number' ||
      typeof parsed.height !== 'number' ||
      typeof parsed.tileSize !== 'number' ||
      typeof parsed.overlap !== 'number' ||
      typeof parsed.format !== 'string' ||
      typeof parsed.tilesBase !== 'string'
    ) {
      return null;
    }

    return {
      width: parsed.width,
      height: parsed.height,
      tileSize: parsed.tileSize,
      overlap: parsed.overlap,
      format: parsed.format,
      tilesBase: parsed.tilesBase,
    };
  } catch {
    return null;
  }
}

async function loadDziInfo(dziUrl: string): Promise<DziInfo | null> {
  try {
    const res = await fetch(dziUrl, { cache: 'force-cache' });
    if (!res.ok) {
      console.warn('[map] DZI manifest fetch failed', { status: res.status, url: dziUrl });
      return null;
    }
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror')) {
      console.warn('[map] DZI manifest XML parse error', { url: dziUrl });
      return null;
    }
    // DZI uses an XML namespace, so prefer namespace-agnostic lookups.
    const image = doc.getElementsByTagName('Image')[0]
      ?? doc.documentElement;
    const size = doc.getElementsByTagName('Size')[0];
    if (!image || !size) {
      console.warn('[map] DZI manifest missing Image/Size', { url: dziUrl });
      return null;
    }

    const tileSize = Number(image.getAttribute('TileSize'));
    const format = (image.getAttribute('Format') || 'webp').toLowerCase();
    const overlap = Number(image.getAttribute('Overlap') || '1');
    const width = Number(size.getAttribute('Width'));
    const height = Number(size.getAttribute('Height'));
    if (!tileSize || !width || !height || Number.isNaN(overlap)) {
      console.warn('[map] DZI manifest has invalid attributes', {
        tileSize,
        overlap,
        width,
        height,
        format,
      });
      return null;
    }

    // Same convention OpenSeadragon uses: <name>.dzi -> <name>_files/<level>/x_y.<fmt>
    const tilesBase = dziUrl.replace(/\.dzi$/i, '_files');

    const info = { width, height, tileSize, overlap, format, tilesBase };
    saveDziInfo(info);
    return info;
  } catch (err) {
    const stored = loadDziInfoFromStorage();
    if (stored) {
      console.warn('[map] Using stored DZI info after load failure', err);
      return stored;
    }

    console.warn('[map] DZI manifest load threw', err);
    return null;
  }
}

/**
 * Eagerly downloads every DZI tile into a shared blob-URL cache so the
 * Map page renders instantly the first time the user opens it. Safe to
 * call multiple times — the heavy work is performed only once per page
 * load. If the DZI manifest is unreachable, this is a no-op.
 */
export function prefetchMapTiles(): Promise<void> {
  if (prefetchTilesPromise) return prefetchTilesPromise;

  prefetchTilesPromise = (async () => {
    const info = await loadDziInfo(MAP_DZI_URL);
    if (!info) return;

    const { width, height, tileSize, format, tilesBase } = info;
    const maxDim = Math.max(width, height);
    const maxLevel = Math.ceil(Math.log2(maxDim));

    // Order: lowest LODs first (cheap, instantly cover full zoom-out), then
    // climb level by level. Each level is iterated centre-out so the most
    // visually important tiles are warmed first.
    const urls: string[] = [];
    for (let level = 0; level <= maxLevel; level += 1) {
      const scale = 2 ** (maxLevel - level);
      const lw = Math.ceil(width / scale);
      const lh = Math.ceil(height / scale);
      const cols = Math.ceil(lw / tileSize);
      const rows = Math.ceil(lh / tileSize);
      const cx = (cols - 1) / 2;
      const cy = (rows - 1) / 2;
      const coords: Array<{ x: number; y: number; d: number }> = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          coords.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2 });
        }
      }
      coords.sort((a, b) => a.d - b.d);
      for (const { x, y } of coords) {
        urls.push(`${tilesBase}/${level}/${x}_${y}.${format}`);
      }
    }

    mapTilesPrefetchActive.value = true;
    mapTilesPrefetchProgress.value = 0;
    const total = urls.length;
    console.info('[map] background prefetch starting', {
      maxLevel,
      totalTiles: total,
      sampleUrl: urls[0],
    });

    let done = 0;
    let okCount = 0;
    let failCount = 0;
    let cursor = 0;
    const cache = 'caches' in window ? await caches.open(MAP_TILE_CACHE_NAME) : null;

    async function worker(): Promise<void> {
      while (cursor < urls.length) {
        const url = urls[cursor++];
        if (!mapTileBlobUrls.has(url)) {
          try {
            const cachedResponse = cache ? await cache.match(url) : null;

            if (cachedResponse && cachedResponse.ok) {
              const blob = await cachedResponse.blob();
              const blobUrl = URL.createObjectURL(blob);
              try {
                const img = new Image();
                img.decoding = 'async';
                img.src = blobUrl;
                await img.decode();
              } catch {
                // decode() can throw on some formats — ignore, the blob URL
                // is still usable and OSD's loader will decode lazily.
              }
              mapTileBlobUrls.set(url, blobUrl);
              okCount += 1;
            } else {
              const response = await fetch(url, { cache: 'force-cache' });
              if (response.ok) {
                const responseForCache = response.clone();
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                try {
                  const img = new Image();
                  img.decoding = 'async';
                  img.src = blobUrl;
                  await img.decode();
                } catch {
                  // decode() can throw on some formats — ignore, the blob URL
                  // is still usable and OSD's loader will decode lazily.
                }
                mapTileBlobUrls.set(url, blobUrl);
                if (cache) {
                  await cache.put(url, responseForCache);
                }
                okCount += 1;
              } else {
                failCount += 1;
              }
            }
          } catch {
            failCount += 1;
          }
        } else {
          okCount += 1;
        }
        done += 1;
        const pct = Math.floor((done / total) * 100);
        if (pct !== mapTilesPrefetchProgress.value) {
          mapTilesPrefetchProgress.value = pct;
        }
      }
    }

    await Promise.all(
      Array.from({ length: PREFETCH_CONCURRENCY }, () => worker())
    );

    mapTilesPrefetchActive.value = false;
    mapTilesPrefetchProgress.value = 100;
    console.info('[map] background prefetch done', {
      cached: okCount,
      failed: failCount,
      total,
    });
  })();

  return prefetchTilesPromise;
}
