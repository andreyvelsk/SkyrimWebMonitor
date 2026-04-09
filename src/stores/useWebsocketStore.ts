import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getWebSocketClient, FIELD_MAPPING } from '@/api/websocket';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection.js';
import type { DataMessage, ServerMessage } from '@/api/websocket';
import { useMonitorStore } from './use-monitor-state/useMonitorStore';

const WS_UPDATE_FREQUENCY = 100; // milliseconds

export const useWebSocketStore = defineStore('websocket', () => {
  const monitorStore = useMonitorStore();
  const { setGeneralState } = monitorStore;

  // State
  const status = ref<string>(CONNECTION_STATUS.DISCONNECTED);
  const error = ref<string | null>(null);
  const isSubscribed = ref(false);

  // Get WebSocket client instance
  const wsClient = getWebSocketClient();

  // Cleanup references
  let unsubscribeFromOpen: (() => void) | null = null;
  let unsubscribeFromClose: (() => void) | null = null;
  let unsubscribeFromError: (() => void) | null = null;
  let unsubscribeFromMessage: (() => void) | null = null;

  // Computed
  const isConnected = computed(() => status.value === CONNECTION_STATUS.CONNECTED);
  const isConnecting = computed(
    () =>
      status.value === CONNECTION_STATUS.CONNECTING ||
      status.value === CONNECTION_STATUS.RECONNECTING
  );

  /**
   * Start subscription to monitor data
   */
  const startSubscription = (): void => {
    if (!wsClient.isConnected()) {
      console.warn('WebSocket is not connected, cannot subscribe');
      return;
    }

    const success = wsClient.subscribe(FIELD_MAPPING, WS_UPDATE_FREQUENCY);
    if (success) {
      isSubscribed.value = true;
      console.log('Subscribed to monitor data updates');
    } else {
      console.error('Failed to subscribe to monitor data');
    }
  };

  /**
   * Stop subscription
   */
  const stopSubscription = (): void => {
    if (!wsClient.isConnected()) {
      return;
    }

    wsClient.unsubscribe();
    isSubscribed.value = false;
    console.log('Unsubscribed from monitor data updates');
  };

  /**
   * Handle data message from server
   */
  const handleDataMessage = (message: DataMessage): void => {
    try {
      setGeneralState(message.fields);
    } catch (err) {
      console.error('Failed to update state from data message:', err);
    }
  };

  // Methods
  const connect = async (): Promise<void> => {
    try {
      status.value = CONNECTION_STATUS.CONNECTING;
      error.value = null;
      await wsClient.connect();
      status.value = CONNECTION_STATUS.CONNECTED;
    } catch (err) {
      status.value = CONNECTION_STATUS.DISCONNECTED;
      error.value = (err as Error).message || 'Failed to connect';
    }
  };

  const disconnect = (): void => {
    stopSubscription();
    wsClient.disconnect();
    status.value = CONNECTION_STATUS.DISCONNECTED;
    error.value = null;
  };

  // Setup event listeners
  const setupListeners = (): void => {
    unsubscribeFromOpen = wsClient.on('onOpen', () => {
      status.value = CONNECTION_STATUS.CONNECTED;
      error.value = null;
      startSubscription();
    });

    unsubscribeFromClose = wsClient.on('onClose', () => {
      status.value = CONNECTION_STATUS.DISCONNECTED;
      isSubscribed.value = false;
    });

    unsubscribeFromError = wsClient.on('onError', (err: any) => {
      status.value = CONNECTION_STATUS.DISCONNECTED;
      error.value = err?.message || 'Connection error';
      isSubscribed.value = false;
    });

    unsubscribeFromMessage = wsClient.onMessage((message: ServerMessage) => {
      if (message.type === 'data') {
        handleDataMessage(message as DataMessage);
      } else if (message.type === 'error') {
        console.error('Server error:', (message as any).message);
      }
    });
  };

  // Cleanup listeners when store is destroyed
  const cleanup = (): void => {
    unsubscribeFromOpen?.();
    unsubscribeFromClose?.();
    unsubscribeFromError?.();
    unsubscribeFromMessage?.();
  };

  // Setup listeners on store creation
  setupListeners();

  return {
    // State
    status,
    error,
    isSubscribed,

    // Computed
    isConnected,
    isConnecting,

    // Methods
    connect,
    disconnect,
    startSubscription,
    stopSubscription,

    // Cleanup
    $dispose: cleanup,
  };
});
