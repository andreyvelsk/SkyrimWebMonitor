import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getWebSocketClient } from '@/api/websocket';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';
import type { DataMessage, ServerMessage } from '@/api/websocket';
import { DataRouter } from '@/stores/adapters/dataRouter';
import type { Subscription } from './types';

const WS_UPDATE_FREQUENCY = 100; // milliseconds

export const useWebSocketStore = defineStore('websocket', () => {
  // State
  const status = ref<string>(CONNECTION_STATUS.DISCONNECTED);
  const error = ref<string | null>(null);
  const activeSubscriptions = ref<Map<string, Subscription>>(new Map());

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

  const startSubscription = (
    subscriptionId: string,
    fieldMapping: Record<string, string>,
    frequency: number = WS_UPDATE_FREQUENCY,
    sendOnChange: boolean = true
  ): void => {
    if (!wsClient.isConnected()) {
      console.warn('WebSocket is not connected, cannot subscribe');
      return;
    }

    const success = wsClient.subscribe(subscriptionId, fieldMapping, frequency, sendOnChange);
    if (success) {
      activeSubscriptions.value.set(subscriptionId, { id: subscriptionId, fieldMapping, frequency });
      console.log(`Subscribed [${subscriptionId}]`, fieldMapping);
    } else {
      console.error(`Failed to subscribe [${subscriptionId}]`);
    }
  };

  const stopSubscription = (subscriptionId: string): void => {
    if (!wsClient.isConnected()) {
      return;
    }

    const success = wsClient.unsubscribe(subscriptionId);
    if (success) {
      activeSubscriptions.value.delete(subscriptionId);
      console.log(`Unsubscribed [${subscriptionId}]`);
    }
  };

  const stopAllSubscriptions = (): void => {
    if (!wsClient.isConnected()) {
      return;
    }

    const success = wsClient.unsubscribeAll();
    if (success) {
      activeSubscriptions.value.clear();
      console.log('Unsubscribed from all subscriptions');
    }
  };

  const handleDataMessage = (message: DataMessage): void => {
    try {
      console.log(`[WebSocket] Received data [${message.id}] at ${new Date(message.ts).toISOString()}:`, message.fields);

      if (!activeSubscriptions.value.has(message.id)) {
        console.warn(`[WebSocket] Received data for unknown subscription [${message.id}]`);
      }

      const result = DataRouter.routeDataById(message.id, message.fields);
      if (!result.success) {
        console.warn(`[WebSocket] Routing failed: ${result.message}`);
      }
    } catch (err) {
      console.error('[WebSocket] Failed to handle data message:', err);
    }
  };

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
    stopAllSubscriptions();
    wsClient.disconnect();
    status.value = CONNECTION_STATUS.DISCONNECTED;
    error.value = null;
  };

  const setupListeners = (): void => {
    unsubscribeFromOpen = wsClient.on('onOpen', () => {
      status.value = CONNECTION_STATUS.CONNECTED;
      error.value = null;
      console.log('WebSocket connected, ready for subscriptions');
    });

    unsubscribeFromClose = wsClient.on('onClose', () => {
      status.value = CONNECTION_STATUS.DISCONNECTED;
      activeSubscriptions.value.clear();
    });

    unsubscribeFromError = wsClient.on('onError', (err: unknown) => {
      status.value = CONNECTION_STATUS.DISCONNECTED;
      error.value = (err as { message?: string })?.message || 'Connection error';
      activeSubscriptions.value.clear();
    });

    unsubscribeFromMessage = wsClient.onMessage((message: ServerMessage) => {
      if (message.type === 'data') {
        handleDataMessage(message as DataMessage);
      } else if (message.type === 'error') {
        console.error('Server error:', (message as { message?: string }).message);
      }
    });
  };

  const cleanup = (): void => {
    unsubscribeFromOpen?.();
    unsubscribeFromClose?.();
    unsubscribeFromError?.();
    unsubscribeFromMessage?.();
  };

  setupListeners();

  return {
    status,
    error,
    activeSubscriptions,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    startSubscription,
    stopSubscription,
    $dispose: cleanup,
  };
});
