import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';
import {
  getPageFields,
  getPageSettings,
  getPageSubscriptionId,
  getTabCategorySubscription,
  TAB_CATEGORY_SUBSCRIPTIONS,
} from '@/app/config/pageRegistry';
import { GLOBAL_SUBSCRIPTIONS } from '@/app/config/globalSubscriptions';
import { DataRouter } from '@/stores/adapters/dataRouter';

export function useAppLoader() {
  const navigationStore = useNavigationStore();
  const { activeTab, activeSubTab } = storeToRefs(navigationStore);

  const websocketStore = useWebSocketStore();
  const { connect, startSubscription, stopSubscription, sendQuery } = websocketStore;
  const { isConnected } = storeToRefs(websocketStore);

  const gameStatusStore = useGameStatusStore();
  const { canAct } = storeToRefs(gameStatusStore);

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

  const startGlobalSubscriptions = (): void => {
    Object.values(GLOBAL_SUBSCRIPTIONS).forEach((cfg) => {
      startSubscription(cfg.subscriptionId, cfg.fields, cfg.settings?.frequency, cfg.settings?.sendOnChange);
    });
  };

  const startActivePageSubscription = (): void => {
    const subscriptionId = getPageSubscriptionId(activeTab.value, activeSubTab.value);
    if (!subscriptionId) return;
    const pageFields = getPageFields(activeTab.value, activeSubTab.value);
    const pageSettings = getPageSettings(activeTab.value, activeSubTab.value);
    startSubscription(subscriptionId, pageFields, pageSettings?.frequency, pageSettings?.sendOnChange);
  };

  // Triggered when the player is actually in-game (canAct === true) and the
  // connection is live. Performs the one-time category bootstrap and starts
  // live subscriptions for the active tab/page.
  const loadInitialDataAndStartActiveSubs = (): void => {
    try {
      Object.values(TAB_CATEGORY_SUBSCRIPTIONS).forEach((cfg) => {
        sendQuery(cfg.subscriptionId, cfg.fields, (fields) => {
          DataRouter.routeDataById(cfg.subscriptionId, fields);
        });
      });
    } catch (err) {
      console.error('Initial category queries failed:', err);
    }

    startCategorySubscription(activeTab.value);
    startActivePageSubscription();
  };

  onMounted(async () => {
    try {
      console.log('App mounted - initializing WebSocket connection...');
      await connect();
    } catch (err) {
      console.error('Failed to initialize websocket connection', err);
    }
  });

  // The server starts as soon as Skyrim's main menu loads, NOT when the player
  // actually enters the game world. We must therefore only re-arm GLOBAL
  // subscriptions on connect — `gameStatus` is the signal that tells us when
  // the player is ready (canAct === true). Gameplay subscriptions are gated
  // on `canAct` below.
  watch(isConnected, (connected, prev) => {
    if (connected && !prev) {
      console.log('WebSocket connected, re-arming global subscriptions');
      startGlobalSubscriptions();

      // If we reconnected WHILE the player is still in-game, the server has
      // cleared its subscription table on disconnect. The canAct watcher only
      // fires on transitions, so we must re-arm gameplay subs explicitly here.
      if (canAct.value) {
        console.log('Reconnected while in-game — re-arming gameplay subscriptions');
        loadInitialDataAndStartActiveSubs();
      }
    }
  });

  // Gate ALL gameplay-data subscriptions on `canAct`. Before this is true,
  // queries for inventory/magic/stats return empty or invalid data
  watch(canAct, () => {
    if (!isConnected.value) return;

    console.log('Player is in-game (canAct=true) — loading initial data');
    loadInitialDataAndStartActiveSubs();
  }, { once: true});

  // React to tab/sub-tab changes — only when the player is actually in-game.
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
