<template>
  <div class="handheld-device">
    <!-- Show connection status when not connected -->
    <connection-status v-if="isConnected" />
    <template v-else>
      <skyrim-navigation
        :active-tab="activeTab"
        :active-sub-tab="activeSubTab"
      />

      <main class="content-area">
        <skyrim-content
          :tab="activeTab"
          :sub-tab="activeSubTab"
        />
      </main>
    </template>
    <skyrim-modal />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { SkyrimNavigation, SkyrimContent } from '@/app/ui';
import { ConnectionStatus, SkyrimModal } from '@/shared/ui';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useAppLoader } from '@/shared/lib/composables/useAppLoader';

const navigationStore = useNavigationStore();
const { activeTab, activeSubTab } = storeToRefs(navigationStore);

const websocketStore = useWebSocketStore();
const { isConnected } = storeToRefs(websocketStore);

// Externalized loading/subscription logic
useAppLoader();
</script>

<style scoped lang="scss">
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

.content-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
