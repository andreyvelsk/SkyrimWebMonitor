<template>
  <div class="flex items-center justify-center h-100">
    <div class="flex items-center gap-2">
      <!-- Status Icon -->
      <div class="flex-shrink-0">
        <div
          class="w-3 h-3 rounded-full animate-pulse"
          :class="{
            'bg-yellow-600': wsStore.isConnecting,
            'bg-red-600': !wsStore.isConnected && !wsStore.isConnecting,
          }"
        />
      </div>

      <!-- Status Text -->
      <div class="flex-1 text-gray-200">
        <p class="text-sm font-semibold">
          {{ statusText }}
        </p>
        <p
          v-if="wsStore.error"
          class="text-xs opacity-75"
        >
          {{ wsStore.error }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';

const { t } = useI18n();
const wsStore = useWebSocketStore();

const statusText = computed(() => {
  if (wsStore.status === CONNECTION_STATUS.CONNECTED) {
    return t('shared.ui.connectionStatus.connected');
  }
  if (wsStore.status === CONNECTION_STATUS.CONNECTING) {
    return t('shared.ui.connectionStatus.connecting');
  }
  if (wsStore.status === CONNECTION_STATUS.RECONNECTING) {
    return t('shared.ui.connectionStatus.reconnecting');
  }
  return t('shared.ui.connectionStatus.disconnected');
});
</script>
