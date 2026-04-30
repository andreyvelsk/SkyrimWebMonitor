<template>
  <foreignObject
    :x="player.x - playerHalfSize"
    :y="player.y - playerHalfSize"
    :width="playerSize"
    :height="playerSize"
    :transform="`rotate(${player.angleDeg} ${player.x} ${player.y})`"
  >
    <div
      xmlns="http://www.w3.org/1999/xhtml"
      class="player-marker"
      :style="{ '--icon-src': `url('${iconUrl}')` }"
    />
  </foreignObject>
</template>

<script setup lang="ts">
import type { PlayerOverlayPosition } from '../../types';

defineProps<{
  player: PlayerOverlayPosition;
  playerSize: number;
  playerHalfSize: number;
  iconUrl: string;
}>();
</script>

<style scoped lang="scss">
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
