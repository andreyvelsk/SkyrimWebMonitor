<template>
  <div
    ref="containerRef"
    class="map-page"
    @touchstart.stop="onTouchStart"
    @touchmove.prevent.stop="onTouchMove"
    @touchend.stop="onTouchEnd"
    @touchcancel.stop="onTouchEnd"
    @wheel.prevent="onWheel"
    @click="onClick"
  >
    <img
      :src="MAP_IMAGE_SRC"
      class="map-image"
      :class="{ 'is-grabbing': isPanning }"
      :style="imageStyle"
      :alt="$t('pages.map.alt')"
      draggable="false"
      @load="onImageLoad"
    >
    <map-markers
      ref="markersRef"
      :img-natural-w="imgNaturalW"
      :img-natural-h="imgNaturalH"
      :scale="scale"
      :cover-scale="coverScale"
      :overlay-style="imageStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { MAP_IMAGE_URL, preloadMapImage } from './preloadMap';
import MapMarkers from './MapMarkers.vue';

// =============================================================
// Map view configuration
// All tunable parameters are kept here as named constants.
// =============================================================

/** Path to the map image (served from /public). */
const MAP_IMAGE_SRC = MAP_IMAGE_URL;

/**
 * Minimum zoom factor relative to the "cover" base scale (the scale at which
 * the image fully fills the viewport with no empty bars). Must be >= 1 — any
 * value below 1 would expose background bars, which is forbidden.
 */
const MIN_ZOOM_FACTOR = 1;

/** Maximum zoom factor relative to the cover base scale. */
const MAX_ZOOM_FACTOR = 6;

/** Initial zoom factor relative to the cover base scale. */
const INITIAL_ZOOM_FACTOR = 2.5;

/** Wheel/trackpad zoom sensitivity. Higher = faster zoom per wheel tick. */
const WHEEL_ZOOM_SPEED = 0.0015;

/** Maximum allowed delay (ms) between two taps to count as a double-tap. */
const DOUBLE_TAP_DELAY = 10;
/** Max distance (px) between two taps to still register as a double-tap. */
const DOUBLE_TAP_MAX_DISTANCE = 30;
/** Zoom factor (relative to cover) applied on double-tap zoom-in. */
const DOUBLE_TAP_ZOOM_FACTOR = 2.5;
/**
 * Maximum distance (px) the finger may travel between touchstart and
 * touchend while still being treated as a tap (used for click-coordinate
 * logging). Anything beyond this is considered a pan gesture.
 */
const TAP_MAX_MOVEMENT = 8;
/** Background color shown around the image during transitions / before load. */
const BACKGROUND_COLOR = 'var(--skyrim-bg-dark)';

// =============================================================
// Torn-paper edge effect
// Drawn as an SVG mask: a white rect inset from the edges, distorted by an
// feTurbulence/feDisplacementMap filter so its outline becomes irregular.
// All parameters live in viewBox units (0..TEAR_VIEWBOX) and stretch with the
// container thanks to `preserveAspectRatio='none'`.
// =============================================================

/** SVG viewBox size for the mask. Larger = finer noise resolution. */
const TEAR_VIEWBOX = 400;
/** Distance (viewBox units) from each edge to the rect that gets distorted. */
const TEAR_INSET = 5;
/** feTurbulence baseFrequency. Smaller = larger, smoother tears. */
const TEAR_BASE_FREQUENCY = 0.055;
/** feTurbulence octaves. Higher = more detailed roughness. */
const TEAR_OCTAVES = 3;
/** feDisplacementMap scale (viewBox units). Higher = deeper tears. */
const TEAR_DISPLACEMENT = 32;
/** feTurbulence seed. Change to vary the pattern. */
const TEAR_SEED = 4;
/** Soft drop-shadow under the torn edges, gives a slight paper depth. */
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

const containerRef = ref<HTMLElement | null>(null);
const markersRef = ref<InstanceType<typeof MapMarkers> | null>(null);

/**
 * Natural image dimensions. Populated on image load. Until then we cannot
 * compute the cover scale, so interactions are no-ops.
 */
const imgNaturalW = ref(0);
const imgNaturalH = ref(0);

/** Current absolute scale (in CSS pixels per natural image pixel). */
const scale = ref(0);
const translateX = ref(0);
const translateY = ref(0);
const isPanning = ref(false);

const imageStyle = computed(() => ({
  width: `${imgNaturalW.value}px`,
  height: `${imgNaturalH.value}px`,
  transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0) scale(${scale.value})`,
  transformOrigin: '0 0',
}));

// =============================================================
// Scale helpers
// =============================================================

/**
 * Cover scale: the scale at which the image fully fills the viewport with no
 * empty bars. This is the floor for all zoom operations.
 */
function getCoverScale(): number {
  const cont = containerRef.value;
  if (!cont || !imgNaturalW.value || !imgNaturalH.value) return 1;
  return Math.max(
    cont.clientWidth / imgNaturalW.value,
    cont.clientHeight / imgNaturalH.value
  );
}

function getMinScale(): number {
  return getCoverScale() * MIN_ZOOM_FACTOR;
}

function getMaxScale(): number {
  return getCoverScale() * MAX_ZOOM_FACTOR;
}

/** Reactive cover scale exposed to child overlays (e.g. markers). */
const coverScale = computed(() => getCoverScale());

// =============================================================
// Gesture tracking
// =============================================================

type Mode = 'none' | 'pan' | 'pinch';
let mode: Mode = 'none';

let lastTouchX = 0;
let lastTouchY = 0;
let lastPinchDistance = 0;
let lastPinchCenterX = 0;
let lastPinchCenterY = 0;

let lastTapTime = 0;
let lastTapX = 0;
let lastTapY = 0;

/** Tracks if the current touch sequence has moved beyond the tap threshold. */
let tapStartX = 0;
let tapStartY = 0;
let tapMoved = false;

function getDistance(t1: Touch, t2: Touch): number {
  return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function canPanX(): boolean {
  const cont = containerRef.value;
  if (!cont) return false;
  return imgNaturalW.value * scale.value > cont.clientWidth + 1e-6;
}

function canPanY(): boolean {
  const cont = containerRef.value;
  if (!cont) return false;
  return imgNaturalH.value * scale.value > cont.clientHeight + 1e-6;
}

function isZoomedIn(): boolean {
  return scale.value > getMinScale() + 1e-6;
}

function clampTranslation(): void {
  const cont = containerRef.value;
  if (!cont) return;
  const cw = cont.clientWidth;
  const ch = cont.clientHeight;
  const sw = imgNaturalW.value * scale.value;
  const sh = imgNaturalH.value * scale.value;

  if (sw <= cw) {
    translateX.value = (cw - sw) / 2;
  } else {
    translateX.value = Math.max(cw - sw, Math.min(0, translateX.value));
  }

  if (sh <= ch) {
    translateY.value = (ch - sh) / 2;
  } else {
    translateY.value = Math.max(ch - sh, Math.min(0, translateY.value));
  }
}

function setScaleAt(newScale: number, focalClientX: number, focalClientY: number): void {
  const cont = containerRef.value;
  if (!cont || !scale.value) return;
  const rect = cont.getBoundingClientRect();
  const fx = focalClientX - rect.left;
  const fy = focalClientY - rect.top;

  const clamped = Math.max(getMinScale(), Math.min(getMaxScale(), newScale));
  if (clamped === scale.value) return;

  // Keep the focal point fixed in image space.
  translateX.value = fx - ((fx - translateX.value) / scale.value) * clamped;
  translateY.value = fy - ((fy - translateY.value) / scale.value) * clamped;
  scale.value = clamped;
  clampTranslation();
}

function resetView(): void {
  const cont = containerRef.value;
  scale.value = getCoverScale() * INITIAL_ZOOM_FACTOR;
  if (cont) {
    translateX.value = (cont.clientWidth - imgNaturalW.value * scale.value) / 2;
    translateY.value = (cont.clientHeight - imgNaturalH.value * scale.value) / 2;
  } else {
    translateX.value = 0;
    translateY.value = 0;
  }
  clampTranslation();
}

// =============================================================
// Touch handlers
// =============================================================

function onTouchStart(e: TouchEvent): void {
  if (e.touches.length === 1) {
    const t = e.touches[0];
    mode = 'pan';
    isPanning.value = canPanX() || canPanY();
    lastTouchX = t.clientX;
    lastTouchY = t.clientY;
    tapStartX = t.clientX;
    tapStartY = t.clientY;
    tapMoved = false;

    const now = Date.now();
    const dx = t.clientX - lastTapX;
    const dy = t.clientY - lastTapY;
    const tapDistance = Math.hypot(dx, dy);
    if (now - lastTapTime < DOUBLE_TAP_DELAY && tapDistance < DOUBLE_TAP_MAX_DISTANCE) {
      const target = isZoomedIn()
        ? getMinScale()
        : getCoverScale() * DOUBLE_TAP_ZOOM_FACTOR;
      setScaleAt(target, t.clientX, t.clientY);
      lastTapTime = 0;
      // Treat as handled — no single-tap log.
      tapMoved = true;
    } else {
      lastTapTime = now;
      lastTapX = t.clientX;
      lastTapY = t.clientY;
    }
  } else if (e.touches.length === 2) {
    mode = 'pinch';
    isPanning.value = false;
    tapMoved = true;
    lastPinchDistance = getDistance(e.touches[0], e.touches[1]);
    lastPinchCenterX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    lastPinchCenterY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
  }
}

function onTouchMove(e: TouchEvent): void {
  if (mode === 'pan' && e.touches.length === 1) {
    const t = e.touches[0];
    const dx = t.clientX - lastTouchX;
    const dy = t.clientY - lastTouchY;
    lastTouchX = t.clientX;
    lastTouchY = t.clientY;
    if (!tapMoved && Math.hypot(t.clientX - tapStartX, t.clientY - tapStartY) > TAP_MAX_MOVEMENT) {
      tapMoved = true;
    }
    if (canPanX()) translateX.value += dx;
    if (canPanY()) translateY.value += dy;
    clampTranslation();
  } else if (mode === 'pinch' && e.touches.length >= 2) {
    const dist = getDistance(e.touches[0], e.touches[1]);
    const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;

    if (lastPinchDistance > 0) {
      const factor = dist / lastPinchDistance;
      setScaleAt(scale.value * factor, cx, cy);
    }

    // Two-finger pan along with pinch.
    if (canPanX()) translateX.value += cx - lastPinchCenterX;
    if (canPanY()) translateY.value += cy - lastPinchCenterY;
    clampTranslation();

    lastPinchDistance = dist;
    lastPinchCenterX = cx;
    lastPinchCenterY = cy;
  }
}

function onTouchEnd(e: TouchEvent): void {
  if (e.touches.length === 0) {
    // If this was a quick stationary tap, log the image-pixel coordinates of
    // the tap so reference points can be calibrated.
    if (mode === 'pan' && !tapMoved) {
      logImagePxAt(tapStartX, tapStartY);
    }
    mode = 'none';
    isPanning.value = false;
  } else if (e.touches.length === 1) {
    mode = 'pan';
    isPanning.value = canPanX() || canPanY();
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
  }
}

function onWheel(e: WheelEvent): void {
  const factor = 1 + -e.deltaY * WHEEL_ZOOM_SPEED;
  setScaleAt(scale.value * factor, e.clientX, e.clientY);
}

function onClick(e: MouseEvent): void {
  // Marker clicks use `@click.stop`, so any event reaching this handler
  // came from the empty map area — clear marker selection.
  markersRef.value?.clearSelection();
  // Mouse-click coordinate logging for desktop calibration. Touch is handled
  // separately in onTouchEnd because @click is suppressed when touchmove
  // calls preventDefault.
  logImagePxAt(e.clientX, e.clientY);
}

/**
 * Convert client (viewport) coordinates to natural image-pixel coordinates,
 * accounting for the current zoom and pan transform.
 */
function clientToImagePx(clientX: number, clientY: number): { x: number; y: number } | null {
  const cont = containerRef.value;
  if (!cont || !scale.value) return null;
  const rect = cont.getBoundingClientRect();
  return {
    x: (clientX - rect.left - translateX.value) / scale.value,
    y: (clientY - rect.top - translateY.value) / scale.value,
  };
}

function logImagePxAt(clientX: number, clientY: number): void {
  const p = clientToImagePx(clientX, clientY);
  if (!p) return;
  // Format that can be pasted directly into the *_IMAGE_PX constants in
  // useMapCoordinates.ts.
  console.log(`[map] image px: { x: ${p.x.toFixed(2)}, y: ${p.y.toFixed(2)} }`);
}

function onImageLoad(e: Event): void {
  const img = e.target as HTMLImageElement;
  imgNaturalW.value = img.naturalWidth;
  imgNaturalH.value = img.naturalHeight;
  resetView();
}

// =============================================================
// Lifecycle
// =============================================================

function onResize(): void {
  if (!imgNaturalW.value) return;
  const cont = containerRef.value;
  if (!cont) return;
  const minS = getMinScale();
  const maxS = getMaxScale();
  if (scale.value < minS || scale.value > maxS) {
    scale.value = Math.max(minS, Math.min(maxS, scale.value));
  }
  clampTranslation();
}

onMounted(() => {
  // Make sure the bitmap is in the cache. If the global preloader has already
  // fired, this call returns the same resolved promise instantly.
  preloadMapImage();
  window.addEventListener('resize', onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
});
</script>

<style scoped lang="scss">
.map-page {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background-color: v-bind(BACKGROUND_COLOR);
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

  /* Torn-paper edge: SVG mask cuts irregular bites out of all four sides,
     drop-shadow gives the cut edge a subtle depth. */
  -webkit-mask-image: v-bind(TEAR_MASK_URL);
  mask-image: v-bind(TEAR_MASK_URL);
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  filter: drop-shadow(v-bind(TEAR_SHADOW));
}

.map-image {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
  cursor: grab;
}

.map-image.is-grabbing {
  cursor: grabbing;
}
</style>
