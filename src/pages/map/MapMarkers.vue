<template>
  <svg
    v-if="imgNaturalW && imgNaturalH"
    class="map-markers"
    :style="overlayStyle"
    :viewBox="`0 0 ${imgNaturalW} ${imgNaturalH}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <image
      v-for="m in markers"
      :key="m.refId"
      :href="m.iconUrl"
      :x="m.x - markerHalfSize"
      :y="m.y - markerSize"
      :width="markerSize"
      :height="markerSize"
      :opacity="m.canFastTravel ? 1 : MARKER_DIM_OPACITY"
      preserveAspectRatio="xMidYMax meet"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapCoordinates } from './composables/useMapCoordinates';
import { resolveMarkerIcon } from './composables/useMapMarkerIcons';
import { useMapHotspotsStore } from '@/stores/map/useMapHotspotsStore';

// =============================================================
// Marker overlay configuration
// All tunables live here so the host component (TheMap) never has to know
// about marker sizes or styling.
// =============================================================

/**
 * Base marker size, in screen pixels at the cover (minimum) zoom level.
 * Markers grow or shrink with zoom according to MARKER_ZOOM_INFLUENCE.
 */
const MARKER_BASE_SIZE_PX = 24;

/**
 * How much the marker size follows the map zoom.
 *   0   — markers stay the same size on screen at every zoom level
 *   1   — markers scale 1:1 with the map (like child SVG elements normally do)
 *   0.5 — square-root scaling: bigger when zoomed in, but not aggressively
 */
const MARKER_ZOOM_INFLUENCE = 0.2;

/** Hard floor for marker size in screen pixels. */
const MARKER_MIN_SIZE_PX = 18;
/** Hard ceiling for marker size in screen pixels. */
const MARKER_MAX_SIZE_PX = 72;

/** Opacity applied to markers whose `canFastTravel` is false. */
const MARKER_DIM_OPACITY = 0.45;

// =============================================================
// Props
// The overlay is positioned and transformed identically to the underlying
// map image. The host passes the natural image dimensions, current absolute
// scale (CSS-px per natural-px), the cover scale (floor of `scale`), and an
// inline style object mirroring the image's transform.
// =============================================================

const props = defineProps<{
  imgNaturalW: number;
  imgNaturalH: number;
  scale: number;
  coverScale: number;
  overlayStyle: StyleValue;
}>();

// =============================================================
// Data sources
// =============================================================

const hotspotsStore = useMapHotspotsStore();
const { hotspots } = storeToRefs(hotspotsStore);
const { matrix } = useMapCoordinates();

/**
 * Hotspots projected from game coords into image-natural-pixel coords.
 * Recomputes only when the hotspot list or the calibration matrix changes —
 * NOT on every zoom/pan.
 */
const markers = computed(() => {
  const m = matrix.value;
  if (!m) return [];
  return hotspots.value
    .filter((h) => h.isVisible)
    .map((h) => ({
      refId: h.refId,
      type: h.type,
      canFastTravel: h.canFastTravel,
      x: m.a * h.x + m.c * h.y + m.e,
      y: m.b * h.x + m.d * h.y + m.f,
      iconUrl: resolveMarkerIcon(h.type),
    }));
});

/**
 * Marker size in image-natural-pixel units. Pre-divided by current scale so
 * that the on-screen size follows the configured `MARKER_ZOOM_INFLUENCE`
 * curve regardless of how the user zooms or pans.
 */
const markerSize = computed(() => {
  const s = props.scale;
  const cover = props.coverScale;
  if (!s || !cover) return 0;
  const zoomFactor = s / cover; // ≥ 1 by construction
  const screenPx = clamp(
    MARKER_BASE_SIZE_PX * Math.pow(zoomFactor, MARKER_ZOOM_INFLUENCE),
    MARKER_MIN_SIZE_PX,
    MARKER_MAX_SIZE_PX
  );
  return screenPx / s;
});

const markerHalfSize = computed(() => markerSize.value / 2);

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
</script>

<style scoped lang="scss">
.map-markers {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  will-change: transform;
  /* `overlayStyle` provides width/height inline; explicit dims here would
     override and break the transform sync with the map image. */
  overflow: visible;
}
</style>
