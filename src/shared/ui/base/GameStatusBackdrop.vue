<template>
  <Teleport to="body">
    <Transition name="game-status-backdrop">
      <div
        v-if="!canAct"
        class="game-status-backdrop"
        role="alertdialog"
        aria-modal="true"
        @click.stop
        @contextmenu.prevent
      >
        <h2>
          {{ $t('shared.ui.gameStatus.title') }}
        </h2>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';

const gameStatusStore = useGameStatusStore();
const { canAct } = storeToRefs(gameStatusStore);
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
