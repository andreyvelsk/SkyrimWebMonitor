<template>
  <g :style="{ '--rest-scale': restScale }">
    <!--
      Base layer keeps the original marker order so the CSS transform
      transition is never interrupted by DOM reordering. These markers are
      always drawn at the resting scale.
    -->
    <g
      v-for="m in markers"
      :key="m.key"
      class="hotspot-marker-group"
      :class="{ 'is-marker-hidden': m.key === selectedMarkerKey }"
      :transform="`translate(${m.x} ${m.y})`"
    >
      <g class="hotspot-marker-scale">
        <use
          class="hotspot-marker"
          :href="`#${iconSymbolByUrl[m.iconUrl]}`"
          :x="-markerHalf(m)"
          :y="-markerWidth(m)"
          :width="markerWidth(m)"
          :height="markerWidth(m)"
          preserveAspectRatio="xMidYMax meet"
        />
      </g>
    </g>

    <!--
      The selected marker is re-rendered as the last SVG child so it is drawn
      above overlapping markers. Its scale-in/scale-out is animated by the
      Vue transition classes, so the animation no longer depends on the DOM
      position of the marker.
    -->
    <Transition name="marker-select">
      <g
        v-if="selectedMarker"
        :key="selectedMarker.key"
        class="hotspot-marker-group"
        :transform="`translate(${selectedMarker.x} ${selectedMarker.y})`"
      >
        <g class="marker-select-scale">
          <use
            class="hotspot-marker"
            :href="`#${iconSymbolByUrl[selectedMarker.iconUrl]}`"
            :x="-markerHalf(selectedMarker)"
            :y="-markerWidth(selectedMarker)"
            :width="markerWidth(selectedMarker)"
            :height="markerWidth(selectedMarker)"
            preserveAspectRatio="xMidYMax meet"
          />
        </g>
      </g>
    </Transition>
  </g>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { LocationProjectedMarker } from '../../lib/types';

const props = defineProps<{
  markers: LocationProjectedMarker[];
  /** Selected (max) size per marker key, already zoom-adjusted. */
  markerMaxSizeByKey: Record<string, number>;
  restScale: string;
  selectedMarkerKey: string | null;
  iconSymbolByUrl: Record<string, string>;
}>();

const selectedMarker = computed<LocationProjectedMarker | null>(
  () => props.markers.find((m) => m.key === props.selectedMarkerKey) ?? null,
);

/** Selected (max) rendered width for a marker; 0 if the key is not sized yet. */
function markerWidth(m: LocationProjectedMarker): number {
  return props.markerMaxSizeByKey[m.key] ?? 0;
}

function markerHalf(m: LocationProjectedMarker): number {
  return markerWidth(m) / 2;
}
</script>

<style scoped lang="scss">
$marker-select-duration: 180ms;

.hotspot-marker-group {
  pointer-events: none;
  // The resting copy reappears only after the enlarged overlay finishes its
  // leave animation, so the two never overlap on the way out.
  transition: opacity $marker-select-duration ease-out $marker-select-duration;

  // Hide the resting copy while the enlarged overlay is on screen, so it
  // doesn't peek out from underneath the enlarged marker.
  &.is-marker-hidden {
    opacity: 0;
    transition: opacity $marker-select-duration ease-out 0ms;
  }
}

.hotspot-marker {
  pointer-events: none;
  transform-box: fill-box;
  transform-origin: center bottom;
}

.hotspot-marker-scale {
  transform: scale(var(--rest-scale, 1));
  transform-origin: 0 0;
}

// Selected-marker overlay (always drawn last, scale animated via <Transition>).
.marker-select-scale {
  transform: scale(1);
  transform-origin: 0 0;
}

.marker-select-enter-active,
.marker-select-leave-active {
  .marker-select-scale {
    transition: transform $marker-select-duration ease-out;
  }
}

.marker-select-enter-from,
.marker-select-leave-to {
  .marker-select-scale {
    transform: scale(var(--rest-scale, 1));
  }
}

.marker-select-enter-to,
.marker-select-leave-from {
  .marker-select-scale {
    transform: scale(1);
  }
}
</style>
