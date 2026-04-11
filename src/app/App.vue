<template>
  <div class="handheld-device">
    <!-- Show connection status when not connected -->
    <connection-status v-if="!isConnected" />
    <template v-else>
      <skyrim-navigation
        :tabs="tabs"
        :active-tab="activeTab"
        :active-sub-tab="activeSubTab"
        @tab-change="setActiveTab"
        @subtab-change="setActiveSubTab"
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
import { watch, onMounted } from 'vue';
import { SkyrimNavigation, SkyrimContent } from '@/app/ui';
import { ConnectionStatus, SkyrimModal } from '@/shared/ui';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { getPageFields, getPageSubscriptionId, getTabCategorySubscription } from '@/app/config/pageRegistry';

const navigationStore = useNavigationStore();
const { setActiveTab, setActiveSubTab } = navigationStore;
const { tabs, activeTab, activeSubTab } = storeToRefs(navigationStore);

const websocketStore = useWebSocketStore();
const { connect, startSubscription, stopSubscription } = websocketStore;
const { isConnected } = storeToRefs(websocketStore);

const startCategorySubscription = (tabId: string): void => {
  const config = getTabCategorySubscription(tabId);
  if (config) {
    startSubscription(config.subscriptionId, config.fields);
  }
};

const stopCategorySubscription = (tabId: string): void => {
  const config = getTabCategorySubscription(tabId);
  if (config) {
    stopSubscription(config.subscriptionId);
  }
};

// Initialize WebSocket connection on app mount
onMounted(async () => {
  console.log('App mounted - initializing WebSocket connection...');
  await connect();
  // After connection, subscribe to current page
  if (isConnected.value) {
    console.log('Connected on mount, subscribing to current page...');
    const pageFields = getPageFields(activeTab.value, activeSubTab.value);
    const subscriptionId = getPageSubscriptionId(activeTab.value, activeSubTab.value);
    if (subscriptionId) {
      startSubscription(subscriptionId, pageFields);
    }
    startCategorySubscription(activeTab.value);
  }
});

// Watch for page changes and update subscription ONLY when connected
// Also handles reconnection by re-subscribing to current page
watch(
  [activeTab, activeSubTab, isConnected],
  (
    [newTab, newSubTab, connected],
    [oldTab, oldSubTab]
  ) => {
    // Only handle subscription changes when connected
    if (!connected) {
      console.log('WebSocket not connected, skipping subscription update');
      return;
    }

    // Handle category subscription lifecycle when main tab changes
    if (oldTab !== newTab) {
      stopCategorySubscription(oldTab);
      startCategorySubscription(newTab);
    }

    const subscriptionId = getPageSubscriptionId(newTab, newSubTab);
    const oldSubscriptionId = getPageSubscriptionId(oldTab, oldSubTab);

    if (!newSubTab) {
      console.log('No sub-tab selected, skipping subscription update');
      if (oldSubscriptionId) stopSubscription(oldSubscriptionId); // Unsubscribe from old page
      return;
    }

    if (oldSubscriptionId && oldSubscriptionId !== subscriptionId) {
      console.log(`Unsubscribing from old page: ${oldSubscriptionId}`);
      stopSubscription(oldSubscriptionId); // Unsubscribe from old page
    }

    console.log(`Subscription update: ${newTab} - ${newSubTab}`);
    const pageFields = getPageFields(newTab, newSubTab);
    if (subscriptionId) startSubscription(subscriptionId, pageFields);
  },
  { immediate: false } // Don't run immediately on mount, connect() handles initial subscription
);
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
  padding: var(--spacing-sm);
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
