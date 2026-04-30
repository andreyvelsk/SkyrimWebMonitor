<template>
  <div class="map-outer">
    <div class="map-page">
      <div
        ref="osdContainerRef"
        class="osd-host"
      />
      <map-markers
        v-if="imgNaturalW && imgNaturalH"
        ref="markersRef"
        class="map-overlay"
        :img-natural-w="imgNaturalW"
        :img-natural-h="imgNaturalH"
        :scale="scale"
        :cover-scale="coverScale"
        :overlay-style="overlayStyle"
      />
      <skyrim-backdrop
        :visible="isPrefetching"
        :teleport="false"
        position="absolute"
        tone="dim"
        :z-index="5"
        role="status"
        aria-live="polite"
        blocking
        class="map-prefetch-backdrop"
      >
        <div class="map-prefetch-backdrop__panel">
          <span class="map-prefetch-backdrop__label">
            {{ $t('pages.map.prefetch.label') }}
          </span>
          <div
            class="map-prefetch-backdrop__bar"
            :style="{ '--p': `${prefetchProgress}%` }"
          />
          <span class="map-prefetch-backdrop__pct">
            {{ $t('pages.map.prefetch.progress', { progress: prefetchProgress }) }}
          </span>
        </div>
      </skyrim-backdrop>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, type StyleValue } from 'vue';
import OpenSeadragon from 'openseadragon';
import { MAP_IMAGE_URL, preloadMapImage } from './preloadMap';
import MapMarkers from './MapMarkers.vue';
import { SkyrimBackdrop } from '@/shared/ui';

// =============================================================
// Map view configuration
// =============================================================

/*
to generate tiles use command

vips dzsave public/skyrim.png public/map-dzi/skyrim \
  --layout dz \
  --tile-size 512 \
  --overlap 1 \
  --suffix '.webp[Q=80]'
*/
/**
 * Optional Deep Zoom (DZI) URL produced by libvips. If the file is reachable,
 * OpenSeadragon serves the map from a tiled pyramid (no lag, no grid, no
 * zoom artefacts). Otherwise the viewer falls back to the single PNG.
 */
const MAP_DZI_URL = `${import.meta.env.BASE_URL}map-dzi/skyrim.dzi`;

/** Initial zoom factor relative to the "cover" home zoom. */
const INITIAL_ZOOM_FACTOR = 2.5;
/** Max zoom factor relative to home zoom. */
const MAX_ZOOM_FACTOR = 1;
/** Background color around the map. */
const BACKGROUND_COLOR = 'var(--skyrim-bg-dark)';

// =============================================================
// Torn-paper edge effect (unchanged)
// =============================================================

const TEAR_VIEWBOX = 400;
const TEAR_INSET = 5;
const TEAR_BASE_FREQUENCY = 0.055;
const TEAR_OCTAVES = 3;
const TEAR_DISPLACEMENT = 32;
const TEAR_SEED = 4;
const TEAR_SHADOW = '0 4px 14px rgba(0, 0, 0, 0.55)';

const TEAR_MASK_URL = (() => {
  const inner = TEAR_VIEWBOX - 2 * TEAR_INSET;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${TEAR_VIEWBOX} ${TEAR_VIEWBOX}' preserveAspectRatio='none'>` +
    `<filter id='t' x='-20%' y='-20%' width='140%' height='140%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${TEAR_BASE_FREQUENCY}' numOctaves='${TEAR_OCTAVES}' seed='${TEAR_SEED}' result='n'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='n' scale='${TEAR_DISPLACEMENT}'/>` +
    `</filter>` +
    `<rect x='${TEAR_INSET}' y='${TEAR_INSET}' width='${inner}' height='${inner}' fill='white' filter='url(#t)'/>` +
    `</svg>`;
  return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
})();

// =============================================================
// State
// =============================================================

const osdContainerRef = ref<HTMLElement | null>(null);
const markersRef = ref<InstanceType<typeof MapMarkers> | null>(null);

const imgNaturalW = ref(0);
const imgNaturalH = ref(0);

/**
 * Current absolute scale (CSS px per natural image px) and translate of the
 * image inside the viewport. Synced from OSD on every viewport update so the
 * marker SVG overlay can mirror the image transform exactly.
 */
const scale = ref(0);
const translateX = ref(0);
const translateY = ref(0);
/** Bumped on each viewport update to keep coverScale reactive. */
const viewportTick = ref(0);

/** Whether tile prefetch is still in progress (used to show a backdrop). */
const isPrefetching = ref(false);
/** 0..100 — how many tiles have been cached so far. */
const prefetchProgress = ref(0);

const overlayStyle = computed<StyleValue>(() => ({
  width: `${imgNaturalW.value}px`,
  height: `${imgNaturalH.value}px`,
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
  transformOrigin: '0 0',
}));

const coverScale = computed(() => {
  // Touch the tick so this recomputes on viewport changes / resize.
  void viewportTick.value;
  const cont = osdContainerRef.value;
  if (!cont || !imgNaturalW.value || !imgNaturalH.value) return 1;
  return Math.max(
    cont.clientWidth / imgNaturalW.value,
    cont.clientHeight / imgNaturalH.value
  );
});

// =============================================================
// OpenSeadragon viewer
// =============================================================

let viewer: OpenSeadragon.Viewer | null = null;

type OsdTileSource = NonNullable<OpenSeadragon.Options['tileSources']>;

async function detectTileSource(): Promise<OsdTileSource> {
  // Try DZI first; HEAD is enough to confirm presence.
  try {
    const res = await fetch(MAP_DZI_URL, { method: 'HEAD', cache: 'force-cache' });
    if (res.ok) return MAP_DZI_URL;
  } catch {
    // fall through
  }
  return { type: 'image', url: MAP_IMAGE_URL } as OsdTileSource;
}

function syncOverlayTransform(): void {
  if (!viewer || !imgNaturalW.value) return;
  const item = viewer.world.getItemAt(0);
  if (!item) return;

  // Project the image's (0,0) and (W,0) onto the viewer's CSS pixel space to
  // recover the affine transform (uniform scale + translate).
  const p0v = item.imageToViewportCoordinates(0, 0, true);
  const pXv = item.imageToViewportCoordinates(imgNaturalW.value, 0, true);
  const p0 = viewer.viewport.pixelFromPoint(p0v, true);
  const pX = viewer.viewport.pixelFromPoint(pXv, true);

  const s = (pX.x - p0.x) / imgNaturalW.value;
  if (s > 0 && Number.isFinite(s)) {
    scale.value = s;
    translateX.value = p0.x;
    translateY.value = p0.y;
  }

  viewportTick.value += 1;
}

function logImagePxAt(imgX: number, imgY: number): void {
  console.log(`[map] image px: { x: ${imgX.toFixed(2)}, y: ${imgY.toFixed(2)} }`);
}

/**
 * Cache every DZI tile as a Blob in JS memory and rewrite the source's
 * `getTileUrl` to return `blob:` URLs. After the prefetch completes, the
 * browser never re-hits the network for tiles regardless of the server's
 * Cache-Control headers, and OSD's internal tile-cache evictions don't cost
 * a thing because re-loading from a blob URL is instant.
 */
const PREFETCH_CONCURRENCY = 12;
const tileBlobUrls = new Map<string, string>();

async function prefetchAllTiles(item: OpenSeadragon.TiledImage): Promise<void> {
  const source = item.source as OpenSeadragon.TileSource & {
    minLevel?: number;
    maxLevel?: number;
    getNumTiles?: (_level: number) => OpenSeadragon.Point;
    getTileUrl?: (_level: number, _x: number, _y: number) => string | (() => string);
  };

  if (typeof source.getTileUrl !== 'function' || typeof source.getNumTiles !== 'function') {
    console.warn('[map] prefetch skipped: source has no tile pyramid', {
      hasGetTileUrl: typeof source.getTileUrl,
      hasGetNumTiles: typeof source.getNumTiles,
      source,
    });
    return; // Single-image source has no tile pyramid to prefetch.
  }

  const originalGetTileUrl = source.getTileUrl.bind(source);
  // Resolve real URL the same way OSD would.
  const resolveUrl = (level: number, x: number, y: number): string => {
    const raw = originalGetTileUrl(level, x, y);
    return typeof raw === 'function' ? raw() : raw;
  };

  // Patch the source so OSD asks for blob URLs once they are ready,
  // and falls back to the network URL until then.
  source.getTileUrl = ((level: number, x: number, y: number): string => {
    const realUrl = resolveUrl(level, x, y);
    return tileBlobUrls.get(realUrl) ?? realUrl;
  }) as typeof source.getTileUrl;

  const minLevel = source.minLevel ?? 0;
  const maxLevel = source.maxLevel ?? 0;

  // Order: lowest LODs first (cheap and cover full zoom-out instantly), then
  // climb level by level. Each level is iterated in a centre-out order so
  // tiles around the current view are warmed before the corners.
  const urls: string[] = [];
  for (let level = minLevel; level <= maxLevel; level += 1) {
    const counts = source.getNumTiles(level);
    const cx = (counts.x - 1) / 2;
    const cy = (counts.y - 1) / 2;
    const coords: Array<{ x: number; y: number; d: number }> = [];
    for (let y = 0; y < counts.y; y += 1) {
      for (let x = 0; x < counts.x; x += 1) {
        coords.push({ x, y, d: (x - cx) ** 2 + (y - cy) ** 2 });
      }
    }
    coords.sort((a, b) => a.d - b.d);
    for (const { x, y } of coords) {
      urls.push(resolveUrl(level, x, y));
    }
  }

  isPrefetching.value = true;
  prefetchProgress.value = 0;
  const total = urls.length;
  console.info('[map] prefetch starting', {
    minLevel,
    maxLevel,
    totalTiles: total,
    sampleUrl: urls[0],
  });
  let done = 0;
  let okCount = 0;
  let failCount = 0;

  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      if (!tileBlobUrls.has(url)) {
        try {
          const response = await fetch(url, { cache: 'force-cache' });
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            // Pre-decode the image so the browser doesn't pay the WebP/PNG
            // decode cost on first render. Without this, blob URLs are already
            // in memory but the actual bitmap is created lazily, which causes
            // a visible flash on rapid zoom transitions.
            try {
              const img = new Image();
              img.decoding = 'async';
              img.src = blobUrl;
              await img.decode();
            } catch {
              // decode() can throw on some formats — ignore, the blob URL is
              // still usable and OSD's loader will decode lazily.
            }
            tileBlobUrls.set(url, blobUrl);
            okCount += 1;
          } else {
            failCount += 1;
          }
        } catch {
          failCount += 1;
          // Network error — leave the original URL so OSD can retry on demand.
        }
      } else {
        okCount += 1;
      }
      done += 1;
      // Throttle reactivity: only update on whole-percent steps.
      const pct = Math.floor((done / total) * 100);
      if (pct !== prefetchProgress.value) prefetchProgress.value = pct;
    }
  }

  const workers = Array.from({ length: PREFETCH_CONCURRENCY }, worker);
  await Promise.all(workers);
  isPrefetching.value = false;
  prefetchProgress.value = 100;
  console.info('[map] prefetch done', {
    cached: okCount,
    failed: failCount,
    total,
  });

  // Note: we deliberately do NOT call viewer.world.resetItems() here. OSD's
  // tile cache already holds the initial tiles; when it evicts them and asks
  // again, our patched `getTileUrl` returns the blob URL and the request is
  // served from memory. Calling resetItems would force a full re-render and
  // produce its own visible flash.
}

function releaseTileBlobUrls(): void {
  for (const url of tileBlobUrls.values()) {
    URL.revokeObjectURL(url);
  }
  tileBlobUrls.clear();
}

function applyHomeBounds(): void {
  if (!viewer) return;
  // Clamp current zoom to a sane initial level relative to home (cover).
  const home = viewer.viewport.getHomeZoom();
  const target = home * INITIAL_ZOOM_FACTOR;
  viewer.viewport.zoomTo(target, undefined, true);
  viewer.viewport.applyConstraints(true);
  syncOverlayTransform();
}

async function setupViewer(): Promise<void> {
  const host = osdContainerRef.value;
  if (!host) return;

  const tileSources = await detectTileSource();

  viewer = OpenSeadragon({
    element: host,
    tileSources,
    prefixUrl: '',
    showNavigator: false,
    showNavigationControl: false,
    showSequenceControl: false,
    showFullPageControl: false,
    showHomeControl: false,
    showZoomControl: false,
    showRotationControl: false,
    // Always cover viewport: home zoom fills, and we forbid any zoom-out below it.
    homeFillsViewer: true,
    visibilityRatio: 1.0,
    constrainDuringPan: true,
    minZoomImageRatio: 1.3,
    maxZoomPixelRatio: MAX_ZOOM_FACTOR,
    animationTime: 0.3,
    springStiffness: 5,
    // false = OSD keeps the previous LOD visible until the next one is fully
    // loaded. With `true` it would clear and re-render immediately, exposing
    // the placeholderFillStyle as a visible flash during fast zoom-out.
    immediateRender: false,
    preserveImageSizeOnResize: true,
    blendTime: 0,
    alwaysBlend: false,
    // Used only as the very last resort when no tile of any LOD is available.
    placeholderFillStyle: BACKGROUND_COLOR,
    // Load lower-res tiles a bit earlier so during a fast zoom there is
    // always *something* sharp-ish to show before the target LOD arrives.
    minPixelRatio: 0.5,
    // Larger cache + more parallel network slots = far less popping during
    // rapid zoom/pan. Numbers are conservative; tune up if memory allows.
    imageLoaderLimit: 8,
    maxImageCacheCount: 2048,
    // Pre-fetch tiles around the current viewport so panning/zooming has
    // them ready instead of starting a request only when they enter view.
    preload: true,
    // Avoid sub-pixel half-transparent seams between adjacent tiles.
    subPixelRoundingForTransparency:
      OpenSeadragon.SUBPIXEL_ROUNDING_OCCURRENCES.ALWAYS as unknown as object,
    smoothTileEdgesMinZoom: Infinity,
    gestureSettingsMouse: {
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: true,
      scrollToZoom: true,
      pinchToZoom: true,
      dragToPan: true,
    },
    gestureSettingsTouch: {
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: true,
      pinchToZoom: true,
      dragToPan: true,
    },
    gestureSettingsPen: {
      clickToZoom: false,
      dblClickToZoom: false,
      flickEnabled: true,
      pinchToZoom: true,
      dragToPan: true,
    },
  });

  viewer.addHandler('open', () => {
    if (!viewer) return;
    const item = viewer.world.getItemAt(0);
    if (!item) return;
    const size = item.getContentSize();
    imgNaturalW.value = size.x;
    imgNaturalH.value = size.y;
    applyHomeBounds();
    void prefetchAllTiles(item);
  });

  viewer.addHandler('update-viewport', syncOverlayTransform);
  viewer.addHandler('resize', syncOverlayTransform);
  viewer.addHandler('animation', syncOverlayTransform);
  viewer.addHandler('animation-finish', syncOverlayTransform);

  viewer.addHandler('canvas-click', (event) => {
    if (!viewer) return;
    if (!event.quick) return;
    const item = viewer.world.getItemAt(0);
    if (!item) return;
    const viewportPoint = viewer.viewport.pointFromPixel(event.position);
    const imgPoint = item.viewportToImageCoordinates(viewportPoint);
    // First let the marker overlay try to handle the tap (selection /
    // fast-travel). Only deselect when the tap landed on empty map area.
    const hit = markersRef.value?.handleClickAt(imgPoint.x, imgPoint.y) ?? false;
    if (!hit) {
      markersRef.value?.clearSelection();
    }
    logImagePxAt(imgPoint.x, imgPoint.y);
  });
}

// =============================================================
// Lifecycle
// =============================================================

onMounted(() => {
  preloadMapImage();
  void setupViewer();
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
  releaseTileBlobUrls();
});
</script>

<style scoped lang="scss">
/*
  .map-outer hosts the torn-paper shadow on a static ::before, so the
  animated OSD canvas underneath stays on its own GPU layer.
*/
.map-outer {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  background-color: v-bind(BACKGROUND_COLOR);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-color: v-bind(BACKGROUND_COLOR);
    -webkit-mask-image: v-bind(TEAR_MASK_URL);
    mask-image: v-bind(TEAR_MASK_URL);
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    filter: drop-shadow(v-bind(TEAR_SHADOW));
  }
}

.map-page {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background-color: v-bind(BACKGROUND_COLOR);

  -webkit-mask-image: v-bind(TEAR_MASK_URL);
  mask-image: v-bind(TEAR_MASK_URL);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;

  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.osd-host {
  position: absolute;
  inset: 0;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.map-prefetch-backdrop {
  cursor: progress;
}

.map-prefetch-backdrop__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 14rem;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--skyrim-bg-medium);
  border: var(--border-thin) solid var(--skyrim-border-medium);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-medium);
  color: var(--skyrim-text-accent);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  letter-spacing: 0.04em;
}

.map-prefetch-backdrop__label {
  color: var(--skyrim-text-accent);
}

.map-prefetch-backdrop__bar {
  position: relative;
  width: 100%;
  height: 6px;
  overflow: hidden;
  background-color: var(--skyrim-bg-dark);
  border: var(--border-thin) solid var(--skyrim-border-dark);
  border-radius: var(--radius-sm);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    width: var(--p, 0%);
    background: linear-gradient(
      90deg,
      var(--skyrim-accent-gold-dim),
      var(--skyrim-accent-gold-light)
    );
    transition: width var(--transition-fast);
  }
}

.map-prefetch-backdrop__pct {
  color: var(--skyrim-text-secondary);
  font-family: var(--font-body);
  font-variant-numeric: tabular-nums;
}
</style>
