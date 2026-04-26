<template>
  <Teleport to="body">
    <Transition name="combat-indicator">
      <div
        v-if="inCombat"
        class="combat-indicator"
        aria-hidden="true"
      >
        <div class="combat-indicator__layer combat-indicator__layer--a" />
        <div class="combat-indicator__layer combat-indicator__layer--b" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';

const gameStatusStore = useGameStatusStore();
const { inCombat } = storeToRefs(gameStatusStore);
</script>

<style scoped lang="scss">
/*
 * Edge-only "danger" vignette that pulses with two layered animations.
 * The two layers run at slightly different durations so the peaks drift
 * out of phase, producing an irregular ("ragged") flicker rather than a
 * clean rhythmic pulse. Colors come from the existing semantic palette
 * (--color-danger / --color-danger-light).
 *
 * Tunable knobs (override on `.combat-indicator` to customize):
 *
 *   --combat-indicator-edge-start  — where the vignette starts fading in
 *                                    from the center (0% = full screen,
 *                                    100% = only at the very edge).
 *                                    Larger value → narrower band at the edges.
 *   --combat-indicator-edge-mid    — soft layer mid stop (between start and 100%).
 *   --combat-indicator-edge-inner  — bright accent layer inner stop (where the
 *                                    sharper flicker starts). Should be > edge-start.
 *
 *   --combat-indicator-intensity   — global multiplier for opacity (0..1+),
 *                                    affects how strongly the indicator is felt.
 *   --combat-indicator-soft-color  — base color of the soft pulsing layer.
 *   --combat-indicator-sharp-color — base color of the sharper flicker layer.
 *   --combat-indicator-soft-alpha-mid / --combat-indicator-soft-alpha-edge
 *                                    — peak alpha values of the soft layer.
 *   --combat-indicator-sharp-alpha-edge
 *                                    — peak alpha value of the sharp accent layer.
 *
 *   --combat-indicator-soft-duration  — period of the soft pulse.
 *   --combat-indicator-sharp-duration — period of the sharp flicker.
 */
.combat-indicator {
  /* Width / spread of the danger band along the edges. */
  --combat-indicator-edge-start: 50%;
  --combat-indicator-edge-mid: 80%;
  --combat-indicator-edge-inner: 60%;

  /* Intensity / colors. */
  --combat-indicator-intensity: 0.8;
  --combat-indicator-soft-color: var(--color-danger);
  --combat-indicator-sharp-color: var(--color-danger-light);
  --combat-indicator-soft-alpha-mid: 0.18;
  --combat-indicator-soft-alpha-edge: 0.35;
  --combat-indicator-sharp-alpha-edge: 0.28;

  /* Animation timings. */
  --combat-indicator-soft-duration: 3.35s;
  --combat-indicator-sharp-duration: 2.95s;

  position: fixed;
  inset: 0;
  // Above page chrome but well below modals and the game-status backdrop.
  z-index: var(--z-fixed);
  pointer-events: none;
}

.combat-indicator__layer {
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  opacity: var(--combat-indicator-intensity);
  will-change: opacity;
}

/* Soft red vignette hugging the edges. */
.combat-indicator__layer--a {
  background: radial-gradient(
    ellipse at center,
    transparent var(--combat-indicator-edge-start),
    rgb(from var(--combat-indicator-soft-color) r g b / var(--combat-indicator-soft-alpha-mid)) var(--combat-indicator-edge-mid),
    rgb(from var(--combat-indicator-soft-color) r g b / var(--combat-indicator-soft-alpha-edge)) 100%
  );
  animation: combat-pulse-a var(--combat-indicator-soft-duration) ease-in-out infinite;
}

/* Tighter, brighter accent that breaks the rhythm of the soft layer. */
.combat-indicator__layer--b {
  background: radial-gradient(
    ellipse at center,
    transparent var(--combat-indicator-edge-inner),
    rgb(from var(--combat-indicator-sharp-color) r g b / 0%) 78%,
    rgb(from var(--combat-indicator-sharp-color) r g b / var(--combat-indicator-sharp-alpha-edge)) 100%
  );
  animation: combat-pulse-b var(--combat-indicator-sharp-duration) steps(8, end) infinite;
}

@keyframes combat-pulse-a {
  0%   { opacity: calc(0.35 * var(--combat-indicator-intensity)); }
  35%  { opacity: calc(0.85 * var(--combat-indicator-intensity)); }
  55%  { opacity: calc(0.45 * var(--combat-indicator-intensity)); }
  80%  { opacity: calc(0.95 * var(--combat-indicator-intensity)); }
  100% { opacity: calc(0.35 * var(--combat-indicator-intensity)); }
}

@keyframes combat-pulse-b {
  0%   { opacity: calc(0.15 * var(--combat-indicator-intensity)); }
  20%  { opacity: calc(0.70 * var(--combat-indicator-intensity)); }
  40%  { opacity: calc(0.25 * var(--combat-indicator-intensity)); }
  60%  { opacity: calc(0.55 * var(--combat-indicator-intensity)); }
  85%  { opacity: calc(0.10 * var(--combat-indicator-intensity)); }
  100% { opacity: calc(0.15 * var(--combat-indicator-intensity)); }
}

/* Smooth fade in/out when entering or leaving combat. */
.combat-indicator-enter-active,
.combat-indicator-leave-active {
  transition: opacity var(--transition-normal);
}

.combat-indicator-enter-from,
.combat-indicator-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .combat-indicator__layer--a,
  .combat-indicator__layer--b {
    animation: none;
    opacity: calc(0.5 * var(--combat-indicator-intensity));
  }
}
</style>
