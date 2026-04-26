<template>
  <div class="handheld-device">
    <template v-if="isConnected">
      <skyrim-navigation
        :active-tab="activeTab"
        :active-sub-tab="activeSubTab"
      />

      <main class="content-area d-flex flex-col flex-1 min-h-0">
        <skyrim-content
          :tab="activeTab"
          :sub-tab="activeSubTab"
        />
      </main>
    </template>

    <connection-status v-else />
    <skyrim-modal />
    <game-status-backdrop />
    <combat-indicator />
    <exit-toast :visible="showToast" />
    <app-version />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { SkyrimNavigation, SkyrimContent } from '@/app/ui';
import {
  AppVersion,
  ConnectionStatus,
  SkyrimModal,
  ExitToast,
  GameStatusBackdrop,
  CombatIndicator,
} from '@/shared/ui';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useAppLoader } from '@/shared/lib/composables/useAppLoader';
import { useBackGuard } from '@/shared/lib/composables/useBackGuard';

const navigationStore = useNavigationStore();
const { activeTab, activeSubTab } = storeToRefs(navigationStore);

const websocketStore = useWebSocketStore();
const { isConnected } = storeToRefs(websocketStore);

useAppLoader();
const { showToast } = useBackGuard();
</script>

<style scoped lang="scss">
/* Vignette overlay is unique to this device frame; layout uses utilities. */

.handheld-device {
  position: relative;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  background-color: var(--skyrim-bg-dark);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(ellipse at top, transparent 60%, rgb(0 0 0 / 30%) 100%),
      radial-gradient(ellipse at bottom, transparent 60%, rgb(0 0 0 / 40%) 100%);
  }
}
</style>
