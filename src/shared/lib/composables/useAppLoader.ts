import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import {
  getPageFields,
  getPageSettings,
  getPageSubscriptionId,
  getTabCategorySubscription,
  TAB_CATEGORY_SUBSCRIPTIONS,
} from '@/app/config/pageRegistry';
import { DataRouter } from '@/stores/adapters/dataRouter';

export function useAppLoader() {
  const navigationStore = useNavigationStore();
  const { activeTab, activeSubTab } = storeToRefs(navigationStore);

  const websocketStore = useWebSocketStore();
  const { connect, startSubscription, stopSubscription, sendQuery } = websocketStore;
  const { isConnected } = storeToRefs(websocketStore);
  const HOTKEYS_SUBSCRIPTION_ID = 'hotkeys.items';
  const HOTKEYS_FIELDS = { items: 'Hotkey::Items' };

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

  onMounted(async () => {
    try {
      console.log('App mounted - initializing WebSocket connection...');
      await connect();

      if (isConnected.value) {
        console.log('Connected on mount, subscribing to current page...');
        const pageFields = getPageFields(activeTab.value, activeSubTab.value);
        const pageSettings = getPageSettings(activeTab.value, activeSubTab.value);
        const subscriptionId = getPageSubscriptionId(activeTab.value, activeSubTab.value);
        if (subscriptionId) startSubscription(subscriptionId, pageFields, pageSettings?.frequency, pageSettings?.sendOnChange);

        // One-time initial load for all category subscriptions (populate store)
        try {
          Object.values(TAB_CATEGORY_SUBSCRIPTIONS).forEach((cfg) => {
            sendQuery(cfg.subscriptionId, cfg.fields, (fields) => {
              DataRouter.routeDataById(cfg.subscriptionId, fields);
            });
          });
        } catch (err) {
          console.error('Initial category queries failed:', err);
        }

        // Start live category subscription for the active tab
        startCategorySubscription(activeTab.value);

        // Start global hotkey subscription (persists for the whole session so
        // any page can reflect current bindings). Not tied to the active tab.
        startSubscription(HOTKEYS_SUBSCRIPTION_ID, HOTKEYS_FIELDS);
      }
    } catch (err) {
      console.error('Failed to initialize websocket connection', err);
    }
  });

  watch(
    [activeTab, activeSubTab, isConnected],
    (
      [newTab, newSubTab, connected],
      [oldTab, oldSubTab]
    ) => {
      if (!connected) {
        console.log('WebSocket not connected, skipping subscription update');
        return;
      }

      if (oldTab !== newTab) {
        stopCategorySubscription(oldTab);
        startCategorySubscription(newTab);
      }

      // Re-establish the global hotkey subscription after reconnect.
      if (!websocketStore.activeSubscriptions.has(HOTKEYS_SUBSCRIPTION_ID)) {
        startSubscription(HOTKEYS_SUBSCRIPTION_ID, HOTKEYS_FIELDS);
      }

      const subscriptionId = getPageSubscriptionId(newTab, newSubTab);
      const oldSubscriptionId = getPageSubscriptionId(oldTab, oldSubTab);

      if (!newSubTab) {
        console.log('No sub-tab selected, skipping subscription update');
        if (oldSubscriptionId) stopSubscription(oldSubscriptionId);
        return;
      }

      if (oldSubscriptionId && oldSubscriptionId !== subscriptionId) {
        console.log(`Unsubscribing from old page: ${oldSubscriptionId}`);
        stopSubscription(oldSubscriptionId);
      }

      console.log(`Subscription update: ${newTab} - ${newSubTab}`);
      const pageFields = getPageFields(newTab, newSubTab);
      const pageSettings = getPageSettings(newTab, newSubTab);
      if (subscriptionId) startSubscription(subscriptionId, pageFields, pageSettings?.frequency, pageSettings?.sendOnChange);
    },
    { immediate: false }
  );
}
