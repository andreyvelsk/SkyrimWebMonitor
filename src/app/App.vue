<template>
  <div class="handheld-device">
    <!-- TODO(debug): temporary subnet detection overlay — remove after verification. -->
    <div
      v-if="debugInfo"
      class="debug-overlay"
    >
      <p class="debug-overlay__line">Local IP: {{ debugInfo.ip }}</p>
      <p class="debug-overlay__line">Subnet: {{ debugInfo.subnet }}</p>
    </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { SkyrimNavigation, SkyrimContent } from '@/app/ui';
import {
  ConnectionStatus,
  SkyrimModal,
  ExitToast,
  GameStatusBackdrop,
  CombatIndicator,
} from '@/shared/ui';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useAppLoader } from '@/app/lib/composables/useAppLoader';
import { useBackGuard } from '@/shared/lib/composables/useBackGuard';
import { getLocalIp, getSubnet } from '@/shared/lib/discovery/getLocalIp';

const navigationStore = useNavigationStore();
const { activeTab, activeSubTab } = storeToRefs(navigationStore);

const websocketStore = useWebSocketStore();
const { isConnected } = storeToRefs(websocketStore);

useAppLoader();
const { showToast } = useBackGuard();

// TODO(debug): temporary subnet detection overlay — remove after verification.
const debugInfo = ref<{ ip: string; subnet: string } | null>(null);

void (async () => {
  const ip = await getLocalIp();
  debugInfo.value = ip ? { ip, subnet: getSubnet(ip) } : { ip: 'not detected', subnet: 'n/a' };
})();
</script>

<style scoped lang="scss">
/* Vignette overlay is unique to this device frame; layout uses utilities. */

.debug-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: rgb(0 0 0 / 80%);
  color: var(--color-success);
  font-family: var(--font-body);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  pointer-events: none;
}

.debug-overlay__line {
  margin: 0;
}

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
