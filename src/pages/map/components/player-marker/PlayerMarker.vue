<template>
  <g :transform="`translate(${player.x} ${player.y}) rotate(${player.angleDeg})`">
    <use
      class="player-marker"
      :href="`#${iconSymbolId}`"
      :x="-playerHalfSize"
      :y="-playerHalfSize"
      :width="playerSize"
      :height="playerSize"
      preserveAspectRatio="xMidYMid meet"
    />
  </g>
</template>

<script setup lang="ts">
import type { PlayerOverlayPosition } from '../../types';

defineProps<{
  player: PlayerOverlayPosition;
  playerSize: number;
  playerHalfSize: number;
  iconSymbolId: string;
}>();
</script>

<style scoped lang="scss">
.player-marker {
  pointer-events: none;
}
</style>
