<template>
  <div class="flex items-center justify-center">
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
import { useWebSocketStore } from '@/stores/useWebsocketStore';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';

const wsStore = useWebSocketStore();

const statusText = computed(() => {
  if (wsStore.status === CONNECTION_STATUS.CONNECTED) {
    return `Connected to server`;
  }
  if (wsStore.status === CONNECTION_STATUS.CONNECTING) {
    return `Connecting to server...`;
  }
  if (wsStore.status === CONNECTION_STATUS.RECONNECTING) {
    return `Reconnecting to server...`;
  }
  return `Disconnected from server`;
});
</script>
