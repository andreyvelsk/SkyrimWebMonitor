<template>
  <Teleport to="body">
    <Transition
      name="game-status-backdrop"
      appear
    >
      <div
        v-if="showBackdrop"
        class="skyrim-backdrop skyrim-backdrop--fixed skyrim-backdrop--overlay skyrim-backdrop--blocking game-status-backdrop"
        style="--skyrim-backdrop-z: calc(var(--z-modal-backdrop) - 50); --skyrim-backdrop-blur: 3px"
        role="alertdialog"
        aria-modal="true"
        @contextmenu.prevent
        @click.stop
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
.game-status-backdrop__icon {
  // BaseIcon paints itself with --skyrim-text-accent via mask-image.
  // No extra color override here — keeps the icon consistent with the rest
  // of the project (WeaponIcon, EquippedHandIcon, etc.).
  filter: drop-shadow(0 0 12px var(--skyrim-border-glow));
}

/* Backdrop transition */
.game-status-backdrop-enter-active,
.game-status-backdrop-leave-active {
  transition: opacity var(--transition-normal);
}

.game-status-backdrop-enter-from,
.game-status-backdrop-leave-to {
  opacity: 0;
}
</style>
