<template>
  <Teleport to="body">
    <Transition
      name="game-status-indicator"
      appear
    >
      <div
        v-if="showIndicator"
        class="game-status-indicator"
        role="status"
        aria-live="polite"
        :aria-label="$t('shared.ui.gameStatus.title')"
      >
        <div
          class="game-status-indicator__arc"
          aria-hidden="true"
        />
        <base-icon
          class="game-status-indicator__icon"
          :icon-path="indicatorIconPath"
          :size="40"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';
import { BaseIcon } from '@/shared/ui';

const gameStatusStore = useGameStatusStore();
const wsStore = useWebSocketStore();
const { isConnected } = storeToRefs(wsStore);
const { canAct, dead } = storeToRefs(gameStatusStore);

// Non-blocking indicator: visible whenever the connection is live but the game
// cannot accept actions. Navigation and data updates stay fully usable.
const showIndicator = computed(() => isConnected.value && !canAct.value);

const indicatorIconPath = computed(() =>
  dead.value ? 'lorc/death-zone.svg' : 'lorc/sands-of-time.svg'
);
</script>

<style scoped lang="scss">
/*
 * Bottom, non-blocking "actions unavailable" indicator.
 *
 * A full-width frosted backdrop that fades upward via a radial mask,
 * anchored at the very bottom of the screen. The icon sits centred
 * above the arc. Pointer events are not intercepted — the app remains
 * fully interactive (view-only).
 */
.game-status-indicator {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: var(--spacing-lg);
  pointer-events: none;
  z-index: var(--z-fixed);
}

.game-status-indicator__arc {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 180px;
  background-color: var(--bg-overlay);
  mask-image: radial-gradient(
    ellipse 120% 100% at 50% 100%,
    #000 20%,
    transparent 70%
  );
  mask-image: radial-gradient(
    ellipse 120% 100% at 50% 100%,
    #000 20%,
    transparent 70%
  );
}

.game-status-indicator__icon {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 12px var(--skyrim-border-glow));
}

/* Indicator transition */
.game-status-indicator-enter-active,
.game-status-indicator-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.game-status-indicator-enter-from,
.game-status-indicator-leave-to {
  opacity: 0;
  transform: translateY(var(--spacing-sm));
}
</style>
