<template>
  <svg
    v-if="imgNaturalW && imgNaturalH"
    class="map-markers"
    :style="overlayStyle"
    :viewBox="`0 0 ${imgNaturalW} ${imgNaturalH}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <location-markers
      :markers="locationMarkers"
      :marker-max-half="markerMaxHalf"
      :marker-max-size="markerMaxSize"
      :rest-scale="restScale"
      :selected-marker-key="selectedMarkerKey"
      @marker-click="onMarkerClick"
    />

    <quest-markers
      :markers="questObjectiveMarkers"
      :marker-max-half="markerMaxHalf"
      :marker-max-size="markerMaxSize"
      :rest-scale="restScale"
      :selected-marker-key="selectedMarkerKey"
      @marker-click="onMarkerClick"
    />

    <player-marker
      v-if="player"
      :player="player"
      :player-size="playerSize"
      :player-half-size="playerHalfSize"
      :icon-url="PLAYER_ICON_URL"
    />

    <selected-marker-label
      v-if="selectedMarker"
      :marker="selectedMarker"
      :marker-size="markerSize"
      :selected-label-offset="selectedLabelOffset"
      :label-height="labelHeight"
      :label-font-size="labelFontSize"
      :label-line-height="labelLineHeight"
      :label-padding-x="labelPaddingX"
      :label-padding-y="labelPaddingY"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed, ref, type StyleValue } from 'vue';
import { storeToRefs } from 'pinia';
import { useMapCoordinates } from './composables/useMapCoordinates';
import { useProjectedMapMarkers } from './composables/useProjectedMapMarkers';
import {
  MARKER_BASE_SIZE_PX,
  MARKER_MAX_SIZE_PX,
  MARKER_MIN_SIZE_PX,
  MARKER_SELECTED_SCALE,
  MARKER_ZOOM_INFLUENCE,
  PLAYER_BASE_SIZE_PX,
  PLAYER_ICON_URL,
  PLAYER_MAX_SIZE_PX,
  PLAYER_MIN_SIZE_PX,
  PLAYER_ZOOM_INFLUENCE,
  QUEST_ICON_URL,
  RAD_TO_DEG,
} from './constants';
import FastTravelModal from './FastTravelModal.vue';
import LocationMarkers from './components/location-markers/LocationMarkers.vue';
import QuestMarkers from './components/quest-markers/QuestMarkers.vue';
import PlayerMarker from './components/player-marker/PlayerMarker.vue';
import SelectedMarkerLabel from './components/selected-marker-label/SelectedMarkerLabel.vue';
import {
  isLocationMarker,
  isQuestMarker,
  type ProjectedMarker,
} from './types';
import { useMapHotspotsStore } from '@/stores/map/useMapHotspotsStore';
import { useMapPlayerStore } from '@/stores/map/useMapPlayerStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';

void [LocationMarkers, QuestMarkers, PlayerMarker, SelectedMarkerLabel];

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
const { hotspots, questMarkers } = storeToRefs(hotspotsStore);
const playerStore = useMapPlayerStore();
const { displayPosition: playerDisplayPosition } = storeToRefs(playerStore);
const { matrix } = useMapCoordinates();
const { locationMarkers, questObjectiveMarkers, markers } = useProjectedMapMarkers({
  matrix,
  hotspots,
  questMarkers,
  questIconUrl: QUEST_ICON_URL,
});

// =============================================================
// Selection + fast-travel flow
// =============================================================
//
// Tapping a marker first "selects" it: the icon scales up and a label with
// the location name appears below. A second tap on the same marker triggers
// fast-travel — but only if the hotspot reports `canFastTravel`. If the
// player taps a different marker, selection moves to that one (no modal).
// =============================================================

const selectedMarkerKey = ref<string | null>(null);

const selectedMarker = computed<ProjectedMarker | null>(() => {
  if (!selectedMarkerKey.value) return null;
  return markers.value.find((m) => m.key === selectedMarkerKey.value) ?? null;
});

const { openModal, closeModal } = useModal();
const wsStore = useWebSocketStore();

function onMarkerClick(m: ProjectedMarker): void {
  if (selectedMarkerKey.value !== m.key) {
    selectedMarkerKey.value = m.key;
    return;
  }
  if (isQuestMarker(m)) return;
  if (!isLocationMarker(m)) return;
  if (!m.canFastTravel) return;
  openModal({
    component: FastTravelModal,
    props: { locationName: m.label },
    on: {
      confirm: () => {
        // Trigger fast-travel to the selected map marker. The marker's
        // `refId` is the hex form ID expected by the protocol.
        wsStore.sendCommand({ command: 'fast_travel', formId: m.refId });
        closeModal();
      },
      cancel: () => closeModal(),
    },
  });
}

/** Clear marker selection. Called by the host map when the user taps the
 *  empty area of the map (those clicks bypass the marker `@click.stop`). */
function clearSelection(): void {
  selectedMarkerKey.value = null;
}

defineExpose({ clearSelection });

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

/** Per-marker rendered size — selected markers are drawn larger. */
const markerMaxSize = computed(() => markerSize.value * MARKER_SELECTED_SCALE);
const markerMaxHalf = computed(() => markerMaxSize.value / 2);
/** CSS variable shared by every marker — non-selected markers shrink to this. */
const restScale = computed(() => (1 / MARKER_SELECTED_SCALE).toFixed(4));

/**
 * Label is anchored just below the marker's baseline (the marker is drawn
 * with `mask-position: center bottom`, so its tip sits at the hotspot's y).
 * All sizes are derived from `markerSize` so the label scales together with
 * the icon as the user zooms.
 */
const labelFontSize = computed(() => Math.max(10, markerSize.value * 0.35));
const labelLineHeight = computed(() => labelFontSize.value * 1.2);
const labelPaddingX = computed(() => labelFontSize.value * 0.6);
const labelPaddingY = computed(() => labelFontSize.value * 0.18);
const labelHeight = computed(
  () => labelLineHeight.value + labelPaddingY.value * 2 + 4
);
const selectedLabelOffset = computed(() => 4 / props.scale);

/**
 * Player marker projected into image-pixel coords with screen-rotated
 * heading already pre-converted to degrees. The store decides which
 * coordinates to plot (live `Player::Position` outside in Tamriel, or
 * cached `Player::ExteriorPosition` while in interiors / city sub-worlds);
 * this component is purely presentational. Hidden before calibration or
 * when the store has no displayable position (e.g. Solstheim).
 */
const player = computed(() => {
  const m = matrix.value;
  const dp = playerDisplayPosition.value;
  if (!m || !dp) return null;
  return {
    x: m.a * dp.x + m.c * dp.y + m.e,
    y: m.b * dp.x + m.d * dp.y + m.f,
    angleDeg: dp.angle * RAD_TO_DEG,
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
</style>
