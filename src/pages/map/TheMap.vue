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
import {
  MAP_IMAGE_URL,
  MAP_DZI_URL,
  preloadMapImage,
  prefetchMapTiles,
  mapTileBlobUrls,
  mapTilesPrefetchActive,
  mapTilesPrefetchProgress,
} from './preloadMap';
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
/** Initial zoom factor relative to the "cover" home zoom. */
const INITIAL_ZOOM_FACTOR = 2.5;
/** Max zoom factor relative to home zoom. */
const MAX_ZOOM_FACTOR = 1;
/** Background color around the map. */
const BACKGROUND_COLOR = 'var(--skyrim-bg-medium)';
/**
 * Pixels to hide on the LEFT and RIGHT edges of the map image (same on both sides).
 * Increase to push the dark horizontal borders out of view.
 */
const MAP_CROP_X = 500;
/** Pixels to hide on the TOP edge of the map image. */
const MAP_CROP_Y_TOP = 1500;
/** Pixels to hide on the BOTTOM edge of the map image. */
const MAP_CROP_Y_BOTTOM = 2000;

// =============================================================
// Torn-paper edge effect (unchanged)
// =============================================================

const TEAR_VIEWBOX = 400;
const TEAR_INSET = 5;
const TEAR_BASE_FREQUENCY = 0.045;
const TEAR_OCTAVES = 2;
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
const containerWidth = ref(0);
const containerHeight = ref(0);

/** Whether tile prefetch is still in progress (used to show a backdrop). */
const isPrefetching = mapTilesPrefetchActive;
/** 0..100 — how many tiles have been cached so far. */
const prefetchProgress = mapTilesPrefetchProgress;

const overlayStyle = computed<StyleValue>(() => ({
  width: `${imgNaturalW.value}px`,
  height: `${imgNaturalH.value}px`,
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
  transformOrigin: '0 0',
}));

const coverScale = computed(() => {
  if (!containerWidth.value || !containerHeight.value || !imgNaturalW.value || !imgNaturalH.value) {
    return 1;
  }
  return Math.max(
    containerWidth.value / imgNaturalW.value,
    containerHeight.value / imgNaturalH.value
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
    if (Math.abs(scale.value - s) > 1e-6) {
      scale.value = s;
    }
    if (Math.abs(translateX.value - p0.x) > 1e-3) {
      translateX.value = p0.x;
    }
    if (Math.abs(translateY.value - p0.y) > 1e-3) {
      translateY.value = p0.y;
    }
  }
}

function syncContainerSize(): void {
  const cont = osdContainerRef.value;
  if (!cont) return;
  const w = cont.clientWidth;
  const h = cont.clientHeight;
  if (containerWidth.value !== w) {
    containerWidth.value = w;
  }
  if (containerHeight.value !== h) {
    containerHeight.value = h;
  }
}

function logImagePxAt(imgX: number, imgY: number): void {
  console.log(`[map] image px: { x: ${imgX.toFixed(2)}, y: ${imgY.toFixed(2)} }`);
}

/**
 * Patch OSD's source so it serves DZI tiles from the shared blob-URL cache
 * populated by `prefetchMapTiles()` (kicked off at app start by
 * `useAppLoader`). Falls back to the original network URL for tiles that
 * are not cached yet, so the viewer is fully usable while the background
 * prefetch is still running.
 *
 * After the prefetch completes, the browser never re-hits the network for
 * tiles regardless of the server's Cache-Control headers, and OSD's
 * internal tile-cache evictions don't cost a thing because re-loading from
 * a blob URL is instant.
 */
function attachSharedTileCache(item: OpenSeadragon.TiledImage): void {
  const source = item.source as OpenSeadragon.TileSource & {
    getTileUrl?: (_level: number, _x: number, _y: number) => string | (() => string);
  };

  if (typeof source.getTileUrl !== 'function') {
    return; // Single-image source has no tile pyramid.
  }

  const originalGetTileUrl = source.getTileUrl.bind(source);
  source.getTileUrl = ((level: number, x: number, y: number): string => {
    const raw = originalGetTileUrl(level, x, y);
    const realUrl = typeof raw === 'function' ? raw() : raw;
    return mapTileBlobUrls.get(realUrl) ?? realUrl;
  }) as typeof source.getTileUrl;

  // Make sure the background prefetch is running. Idempotent: a no-op if it
  // was already started by useAppLoader.
  void prefetchMapTiles();
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
    springStiffness: 3,
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

    // Reposition the item so only the non-dark cropped area is considered
    // the "world" by OSD. This makes homeFillsViewer, visibilityRatio and
    // constrainDuringPan all work relative to the cropped region, which
    // naturally prevents the user from panning into the dark edges.
    if (MAP_CROP_X > 0 || MAP_CROP_Y_TOP > 0 || MAP_CROP_Y_BOTTOM > 0) {
      const W = size.x;
      const croppedW = W - 2 * MAP_CROP_X;
      const croppedH = size.y - MAP_CROP_Y_TOP - MAP_CROP_Y_BOTTOM;
      // In OSD viewport space the item default width is 1.0. We scale it so
      // the cropped region spans exactly 1.0 viewport unit.
      const newWidth = W / croppedW;
      item.setWidth(newWidth);
      item.setPosition(
        new OpenSeadragon.Point(-MAP_CROP_X / croppedW, -MAP_CROP_Y_TOP / croppedW),
      );
      // Also clip rendering so OSD won't bother loading tiles for the dark area.
      item.setClip(new OpenSeadragon.Rect(MAP_CROP_X, MAP_CROP_Y_TOP, croppedW, croppedH));
    }

    syncContainerSize();
    applyHomeBounds();
    attachSharedTileCache(item);
  });

  viewer.addHandler('update-viewport', syncOverlayTransform);
  viewer.addHandler('resize', () => {
    syncContainerSize();
    syncOverlayTransform();
  });

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
  // Note: blob URLs in the shared `mapTileBlobUrls` cache are intentionally
  // NOT revoked here. They live for the lifetime of the page so that
  // re-entering the Map tab is instant.
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
