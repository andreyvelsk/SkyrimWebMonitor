<template>
  <Teleport to="body">
    <Transition name="game-status-backdrop">
      <div
        v-if="showBackdrop"
        class="game-status-backdrop"
        role="alertdialog"
        aria-modal="true"
        @click.stop
        @contextmenu.prevent
      >
        <base-icon
          v-if="dead"
          class="game-status-backdrop__icon"
          icon-path="lorc/death-zone.svg"
          :size="96"
        />
        <h2 v-else>
          {{ $t('shared.ui.gameStatus.title') }}
        </h2>
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

const showBackdrop = computed(() => isConnected.value && !canAct.value);
</script>

<style scoped lang="scss">
.game-status-backdrop {
  position: fixed;
  inset: 0;
  // Sit above page content but below user-initiated modals so a modal can
  // still render on top if it was open when the status flipped.
  z-index: calc(var(--z-modal-backdrop) - 50);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-overlay);
  backdrop-filter: blur(3px);
  pointer-events: auto;
}

.game-status-backdrop__icon {
  // BaseIcon paints itself with --skyrim-text-accent via mask-image.
  // No extra color override here — keeps the icon consistent with the rest
  // of the project (WeaponIcon, EquippedHandIcon, etc.).
  filter: drop-shadow(0 0 12px var(--skyrim-border-glow));
}

/* Smooth fade for the whole overlay + a subtle scale on the panel. */
.game-status-backdrop-enter-active,
.game-status-backdrop-leave-active {
  transition: opacity var(--transition-normal);

  .game-status-backdrop__panel {
    transition:
      opacity var(--transition-normal),
      transform var(--transition-normal);
  }
}

.game-status-backdrop-enter-from,
.game-status-backdrop-leave-to {
  opacity: 0;

  .game-status-backdrop__panel {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
}
</style>
