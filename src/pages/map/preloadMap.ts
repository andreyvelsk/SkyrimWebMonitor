/**
 * URL of the world map image. Centralized so both the map page and the
 * preloader reference the exact same URL, ensuring the browser actually
 * reuses the cached response.
 *
 * Uses Vite's BASE_URL so it works under any deploy base path.
 */
export const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}skyrim.png`;
const MAP_TILES_MANIFEST_URL = `${import.meta.env.BASE_URL}map-tiles/manifest.json`;

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

let preloadStarted = false;
let preloadPromise: Promise<void> | null = null;
let tilesManifestPromise: Promise<MapTilesManifest | null> | null = null;

/**
 * Eagerly fetches the map image into the HTTP/memory cache so that opening
 * the Map tab renders instantly. Safe to call multiple times — the work is
 * performed only once per page load.
 */
export function preloadMapImage(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadStarted = true;

  preloadPromise = new Promise<void>((resolve) => {
    const img = new Image();
    const finish = (): void => resolve();
    img.onload = finish;
    img.onerror = finish;
    img.src = MAP_IMAGE_URL;
    // `decode()` parses the bitmap off the main thread when supported, so the
    // first paint inside the Map tab does not need to do that work.
    if (typeof img.decode === 'function') {
      img.decode().then(finish, finish);
    }
  });

  return preloadPromise;
}

export function isMapPreloadStarted(): boolean {
  return preloadStarted;
}

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
