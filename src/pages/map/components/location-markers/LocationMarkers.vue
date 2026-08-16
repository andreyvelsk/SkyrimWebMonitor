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
      :transform="`translate(${m.x} ${m.y})`"
    >
      <g class="hotspot-marker-scale">
        <use
          class="hotspot-marker"
          :href="`#${iconSymbolByUrl[m.iconUrl]}`"
          :x="-markerMaxHalf"
          :y="-markerMaxSize"
          :width="markerMaxSize"
          :height="markerMaxSize"
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
            :x="-markerMaxHalf"
            :y="-markerMaxSize"
            :width="markerMaxSize"
            :height="markerMaxSize"
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
  markerMaxHalf: number;
  markerMaxSize: number;
  restScale: string;
  selectedMarkerKey: string | null;
  iconSymbolByUrl: Record<string, string>;
}>();

const selectedMarker = computed<LocationProjectedMarker | null>(
  () => props.markers.find((m) => m.key === props.selectedMarkerKey) ?? null,
);
</script>

<style scoped lang="scss">
.hotspot-marker-group {
  pointer-events: none;
  transition: opacity var(--transition-fast);
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
    transition: transform 180ms ease-out;
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
