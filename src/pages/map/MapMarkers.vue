<template>
  <svg
    v-if="imgNaturalW && imgNaturalH"
    class="map-markers"
    :style="overlayStyle"
    :viewBox="`0 0 ${imgNaturalW} ${imgNaturalH}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <!--
      Markers are rendered as <foreignObject> so each icon is a regular HTML
      element painted via CSS mask-image + background-color — the same trick
      BaseIcon.vue uses. This is the only reliable way to recolor a raster/
      external SVG to a CSS-variable color across browsers.
    -->
    <foreignObject
      v-for="m in markers"
      :key="m.refId"
      :x="m.x - markerHalfSize"
      :y="m.y - markerSize"
      :width="markerSize"
      :height="markerSize"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="hotspot-marker"
        :class="{ 'hotspot-marker--dim': !m.canFastTravel }"
        :style="{ '--icon-src': `url('${m.iconUrl}')` }"
      />
    </foreignObject>
    <foreignObject
      v-if="player"
      :x="player.x - playerHalfSize"
      :y="player.y - playerHalfSize"
      :width="playerSize"
      :height="playerSize"
      :transform="`rotate(${player.angleDeg} ${player.x} ${player.y})`"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        class="player-marker"
        :style="{ '--icon-src': `url('${PLAYER_ICON_URL}')` }"
      />
    </foreignObject>
  </svg>
</template>

<script setup lang="ts">
import { computed, type StyleValue } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapCoordinates } from './composables/useMapCoordinates';
import { resolveMarkerIcon } from './composables/useMapMarkerIcons';
import { useMapHotspotsStore } from '@/stores/map/useMapHotspotsStore';
import { useMapPlayerStore } from '@/stores/map/useMapPlayerStore';
import { buildIconPath } from '@/shared/lib/utils/iconPath';

// =============================================================
// Marker overlay configuration
// All tunables live here so the host component (TheMap) never has to know
// about marker sizes or styling.
// =============================================================

/**
 * Base marker size, in screen pixels at the cover (minimum) zoom level.
 * Markers grow or shrink with zoom according to MARKER_ZOOM_INFLUENCE.
 */
const MARKER_BASE_SIZE_PX = 32;

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

// =============================================================
// Player marker
// =============================================================

/** Icon path (relative to /icons/) for the player position marker. */
const PLAYER_ICON_URL = buildIconPath('delapouite/growth.svg');

/**
 * Base size (screen px at cover scale) for the player marker. Slightly
 * larger than hotspots so the player stands out at a glance.
 */
const PLAYER_BASE_SIZE_PX = 28;

/** Same zoom-influence curve idea as hotspots, but tuned independently. */
const PLAYER_ZOOM_INFLUENCE = 0.3;
const PLAYER_MIN_SIZE_PX = 24;
const PLAYER_MAX_SIZE_PX = 96;

/**
 * Skyrim's `angle` is yaw in radians: 0 = North, increases clockwise. SVG's
 * `rotate()` is also clockwise-positive, so we just convert radians → degrees
 * with no axis flip. The growth icon points up by default, which lines up
 * with North.
 */
const RAD_TO_DEG = 180 / Math.PI;

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
const playerStore = useMapPlayerStore();
const { position: playerPosition } = storeToRefs(playerStore);
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

/**
 * Player marker projected into image-pixel coords with screen-rotated
 * heading already pre-converted to degrees. Recomputes whenever the player
 * payload changes — i.e. on every server tick — but the work is O(1).
 * Hidden when the player is in an interior or before calibration.
 */
const player = computed(() => {
  const m = matrix.value;
  const p = playerPosition.value;
  if (!m || !p || p.isInterior) return null;
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
    angleDeg: p.angle * RAD_TO_DEG,
  };
});

const playerSize = computed(() => {
  const s = props.scale;
  const cover = props.coverScale;
  if (!s || !cover) return 0;
  const zoomFactor = s / cover;
  const screenPx = clamp(
    PLAYER_BASE_SIZE_PX * Math.pow(zoomFactor, PLAYER_ZOOM_INFLUENCE),
    PLAYER_MIN_SIZE_PX,
    PLAYER_MAX_SIZE_PX
  );
  return screenPx / s;
});

const playerHalfSize = computed(() => playerSize.value / 2);

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

/* Hotspot icons are loaded as external SVG files. To recolor them with a
   CSS variable we replicate BaseIcon.vue's approach: render an HTML <div>
   inside <foreignObject>, mask it with the icon, and fill via background. */
.hotspot-marker {
  width: 100%;
  height: 100%;
  background-color: var(--skyrim-bg-light);
  mask-image: var(--icon-src);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center bottom;
}

.hotspot-marker--dim {
  opacity: 0.45;
}

.player-marker {
  width: 100%;
  height: 100%;
  background-color: var(--skyrim-border-medium);
  mask-image: var(--icon-src);
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
}
</style>
