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
        :project-world-to-image="projectWorldToImage"
      />
      <button
        type="button"
        class="map-follow-player-btn"
        :class="{ 'is-active': isFollowPlayerMode }"
        :aria-pressed="isFollowPlayerMode"
        @click="toggleFollowPlayerMode"
      >
        <base-icon
          icon-path="map/player.svg"
          :background-color="isFollowPlayerMode ? 'var(--skyrim-accent-gold-light)' : 'var(--skyrim-text-dim)' "
        />
      </button>
      <Transition
        name="map-prefetch-backdrop"
        appear
      >
        <div
          v-if="isPrefetching"
          class="skyrim-backdrop skyrim-backdrop--absolute skyrim-backdrop--dim skyrim-backdrop--blocking map-prefetch-backdrop"
          style="--skyrim-backdrop-z: 5; --skyrim-backdrop-blur: 2px"
          role="status"
          aria-live="polite"
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
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type StyleValue } from 'vue';
import { storeToRefs } from 'pinia';
import OpenSeadragon from 'openseadragon';
import {
  prefetchMapTiles,
  mapTileBlobUrls,
  mapTilesPrefetchActive,
  mapTilesPrefetchProgress,
} from './preloadMap';
import MapMarkers from './MapMarkers.vue';
import { BaseIcon } from '@/shared/ui';
import { useMapProjection, type MapProjectionFn } from './composables/useMapProjection';
import { useMapPlayerStore } from '@/stores/map/useMapPlayerStore';
import { getMapConfig } from './config/mapRegistry';
import type { MapConfig } from './config/types';

// =============================================================
// Map view configuration
// =============================================================

/*
to generate tiles use command

vips dzsave public/maps/<name>.png public/map-dzi/<name> \
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
const isFollowPlayerMode = ref(false);

const playerStore = useMapPlayerStore();
const { displayPosition, position } = storeToRefs(playerStore);

/**
 * Resolve the active map config from the player's current worldspace.
 * Falls back to Tamriel when the worldspace is unknown or null.
 */
const currentWorldspace = computed(() => position.value?.worldspace ?? null);
const mapConfig = computed<MapConfig>(() => getMapConfig(currentWorldspace.value));

/**
 * Per-map projection engine. Re-created when the map config changes
 * (i.e. when the player crosses a worldspace boundary).
 */
const projection = computed(() => useMapProjection(mapConfig.value));
const projectWorldToImage = computed<MapProjectionFn>(() => projection.value.projectWorldToImage);

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

async function detectTileSource(config: MapConfig): Promise<OsdTileSource> {
  // Always prefer DZI. The app precaches `map-dzi/**` for offline mode and
  // a HEAD probe can fail against cache-only responses on some mobile PWAs.
  // Using the DZI URL directly keeps map startup deterministic offline.
  return config.dziUrl;
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

function centerOnPlayer(immediately = true): void {
  if (!viewer || !isFollowPlayerMode.value) return;
  const dp = displayPosition.value;
  if (!dp) return;
  const projected = projectWorldToImage.value(dp);
  if (!projected) return;
  const item = viewer.world.getItemAt(0);
  if (!item) return;

  const targetCenter = item.imageToViewportCoordinates(projected.x, projected.y, true);
  const currentCenter = viewer.viewport.getCenter(true);
  const dx = targetCenter.x - currentCenter.x;
  const dy = targetCenter.y - currentCenter.y;
  if (dx * dx + dy * dy < 1e-10) return;

  viewer.viewport.panTo(targetCenter, immediately);
  // Keep OSD constraints in charge near edges: when the player is close to a
  // border we prefer clamped panning over exposing off-map areas.
  viewer.viewport.applyConstraints(true);
  syncOverlayTransform();
}

function stopFollowPlayerByUser(): void {
  if (!isFollowPlayerMode.value) return;
  isFollowPlayerMode.value = false;
}

function toggleFollowPlayerMode(): void {
  isFollowPlayerMode.value = !isFollowPlayerMode.value;
  if (isFollowPlayerMode.value) {
    centerOnPlayer(true);
  }
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
  void prefetchMapTiles(mapConfig.value.dziUrl);
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

  const config = mapConfig.value;
  const tileSources = await detectTileSource(config);

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
    minZoomImageRatio: 3,
    maxZoomPixelRatio: MAX_ZOOM_FACTOR,
    animationTime: 0.3,
    springStiffness: 1,
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
      scrollToZoom: false,
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
    const cropX = config.cropX;
    const cropYTop = config.cropYTop;
    const cropYBottom = config.cropYBottom;
    if (cropX > 0 || cropYTop > 0 || cropYBottom > 0) {
      const W = size.x;
      const croppedW = W - 2 * cropX;
      const croppedH = size.y - cropYTop - cropYBottom;
      // In OSD viewport space the item default width is 1.0. We scale it so
      // the cropped region spans exactly 1.0 viewport unit.
      const newWidth = W / croppedW;
      item.setWidth(newWidth);
      item.setPosition(
        new OpenSeadragon.Point(-cropX / croppedW, -cropYTop / croppedW),
      );
      // Also clip rendering so OSD won't bother loading tiles for the dark area.
      item.setClip(new OpenSeadragon.Rect(cropX, cropYTop, croppedW, croppedH));
    }

    syncContainerSize();
    applyHomeBounds();
    attachSharedTileCache(item);
    centerOnPlayer(true);
  });

  viewer.addHandler('update-viewport', syncOverlayTransform);
  viewer.addHandler('resize', () => {
    syncContainerSize();
    syncOverlayTransform();
    centerOnPlayer(true);
  });

  // Any explicit user pan/zoom gesture exits follow mode back to free view.
  viewer.addHandler('canvas-drag', stopFollowPlayerByUser);
  viewer.addHandler('canvas-scroll', stopFollowPlayerByUser);
  viewer.addHandler('canvas-pinch', stopFollowPlayerByUser);

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

function destroyViewer(): void {
  if (viewer) {
    viewer.destroy();
    viewer = null;
  }
  imgNaturalW.value = 0;
  imgNaturalH.value = 0;
  scale.value = 0;
  translateX.value = 0;
  translateY.value = 0;
}

// =============================================================
// Lifecycle
// =============================================================

onMounted(() => {
  void setupViewer();
});

watch(displayPosition, () => {
  centerOnPlayer(true);
});

/**
 * When the player crosses a worldspace boundary, destroy the current
 * viewer and create a new one for the target map.
 */
watch(currentWorldspace, (next, prev) => {
  if (next !== prev) {
    destroyViewer();
    void setupViewer();
  }
});

onBeforeUnmount(() => {
  destroyViewer();
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
  mask-image: v-bIND(TEAR_MASK_URL);
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

.map-follow-player-btn {
  position: absolute;
  right: calc(var(--spacing-md) + env(safe-area-inset-right));
  bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
  z-index: 4;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: var(--border-thin) solid var(--skyrim-border-medium);
  border-radius: 999px;
  background-color: var(--skyrim-bg-medium);
  box-shadow: var(--shadow-medium);
  color: var(--skyrim-text-secondary);
  cursor: pointer;
  transform: rotate(45deg);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    transform var(--transition-fast);

  &:active {
    transform: scale(0.96);
  }
}

.map-prefetch-backdrop {
  cursor: progress;
}

.map-prefetch-backdrop-enter-active,
.map-prefetch-backdrop-leave-active {
  transition: opacity var(--transition-normal);
}

.map-prefetch-backdrop-enter-from,
.map-prefetch-backdrop-leave-to {
  opacity: 0;
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
