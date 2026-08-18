import { onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useGameStatusStore } from '@/stores/game/useGameStatusStore';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { useGfxIconsLoader } from '@/features/gfx-icons';
import {
  getPageSubscriptions,
  getTabCategorySubscription,
  TAB_CATEGORY_SUBSCRIPTIONS,
} from '@/app/config/pageRegistry';
import { GLOBAL_SUBSCRIPTIONS } from '@/app/config/globalSubscriptions';
import { DataRouter } from '@/stores/adapters/dataRouter';
import { prefetchMapTiles, getMapConfig } from '@/pages/map';
import { logger } from '@/shared/lib/utils/logger';

export function useAppLoader() {
  const navigationStore = useNavigationStore();
  const { activeTab, activeSubTab } = storeToRefs(navigationStore);

  const websocketStore = useWebSocketStore();
  const { connect, startSubscription, stopSubscription, sendQuery, setCommandsEnabled } = websocketStore;
  const { isConnected } = storeToRefs(websocketStore);

  const gameStatusStore = useGameStatusStore();
  const { canAct } = storeToRefs(gameStatusStore);

  const systemStore = useSystemStore();
  const { features } = storeToRefs(systemStore);
  const gfxIconsLoader = useGfxIconsLoader();

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
    const subs = getPageSubscriptions(activeTab.value, activeSubTab.value);
    subs.forEach((s) => {
      startSubscription(s.id, s.fields, s.settings?.frequency, s.settings?.sendOnChange);
    });
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
    // Kick off DZI tile prefetch in the background BEFORE awaiting the
    // websocket connection. `connect()` can take a while (or hang while the
    // game is not running), and we don't want that to delay map readiness.
    void prefetchMapTiles(getMapConfig(null).dziUrl);

    try {
      logger.log('App mounted - initializing WebSocket connection...');
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
      logger.log('WebSocket connected, re-arming global subscriptions');
      startGlobalSubscriptions();

      // If we reconnected WHILE the player is still in-game, the server has
      // cleared its subscription table on disconnect. The canAct watcher only
      // fires on transitions, so we must re-arm gameplay subs explicitly here.
      if (canAct.value) {
        logger.log('Reconnected while in-game — re-arming gameplay subscriptions');
        loadInitialDataAndStartActiveSubs();
      }
    }
  });

  // Background task: download/cache map icons once the system query returns
  // the feature list. Runs regardless of canAct.
  watch(
    features,
    (newFeatures) => {
      if (isConnected.value && newFeatures.includes('file_download')) {
        console.warn('file_download feature is available — ensuring gfx icons are loaded');
        void gfxIconsLoader.ensureLoaded();
      }
    },
    { immediate: true }
  );

  // Gate ALL gameplay-data subscriptions on `canAct`. Before this is true,
  // queries for inventory/magic/stats return empty or invalid data
  watch(canAct, () => {
    if (!isConnected.value) return;

    logger.log('Player is in-game (canAct=true) — loading initial data');
    loadInitialDataAndStartActiveSubs();
  }, { once: true});

  // Keep the WebSocket command gate in sync with `canAct`. While actions are
  // unavailable the app stays fully navigable (tabs, item browsing) and keeps
  // receiving data, but every `command` sent to the server is dropped.
  watch(
    canAct,
    (enabled) => {
      setCommandsEnabled(enabled);
    },
    { immediate: true }
  );

  // React to tab/sub-tab changes only. Initial/reconnect subscription bootstrap
  // is owned by the `isConnected` and `canAct` watchers above — including this
  // watcher in that flow caused a duplicate `subscribe` for the active page
  // (e.g. `character.stats` was subscribed twice on first connect).
  watch(
    [activeTab, activeSubTab],
    (
      [newTab, newSubTab],
      [oldTab, oldSubTab]
    ) => {
      if (!isConnected.value) {
        logger.log('WebSocket not connected, skipping subscription update');
        return;
      }

      if (oldTab !== newTab) {
        stopCategorySubscription(oldTab);
        startCategorySubscription(newTab);
      }

      const newSubs = getPageSubscriptions(newTab, newSubTab);
      const oldSubs = getPageSubscriptions(oldTab, oldSubTab);
      const newIds = new Set(newSubs.map((s) => s.id));

      // Stop subs from the previous page that the new page does not need.
      oldSubs.forEach((s) => {
        if (!newIds.has(s.id)) {
          logger.log(`Unsubscribing from old page sub: ${s.id}`);
          stopSubscription(s.id);
        }
      });

      if (!newSubTab) {
        logger.log('No sub-tab selected, skipping subscription update');
        return;
      }

      logger.log(`Subscription update: ${newTab} - ${newSubTab}`);
      newSubs.forEach((s) => {
        startSubscription(s.id, s.fields, s.settings?.frequency, s.settings?.sendOnChange);
      });
    },
    { immediate: false }
  );
}
