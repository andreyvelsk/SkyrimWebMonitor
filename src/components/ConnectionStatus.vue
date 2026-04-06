<template>
  <div
    class="flex items-center gap-2 px-4 py-3 rounded-lg"
    :class="{
      'bg-green-100 text-green-800': wsStore.isConnected,
      'bg-yellow-100 text-yellow-800': wsStore.isConnecting,
      'bg-red-100 text-red-800': !wsStore.isConnected && !wsStore.isConnecting,
    }"
  >
    <!-- Status Icon -->
    <div class="flex-shrink-0">
      <div
        class="w-3 h-3 rounded-full animate-pulse"
        :class="{
          'bg-green-600': wsStore.isConnected,
          'bg-yellow-600': wsStore.isConnecting,
          'bg-red-600': !wsStore.isConnected && !wsStore.isConnecting,
        }"
      ></div>
    </div>

    <!-- Status Text -->
    <div class="flex-1">
      <p class="text-sm font-semibold">
        {{ statusText }}
      </p>
      <p v-if="wsStore.error" class="text-xs opacity-75">
        {{ wsStore.error }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import { CONNECTION_STATUS } from '@/constants/connection'

const wsStore = useWebSocketStore()

const statusText = computed(() => {
  if (wsStore.status === CONNECTION_STATUS.CONNECTED) {
    return `Connected to server`
  }
  if (wsStore.status === CONNECTION_STATUS.CONNECTING) {
    return `Connecting to server...`
  }
  if (wsStore.status === CONNECTION_STATUS.RECONNECTING) {
    return `Reconnecting to server...`
  }
  return `Disconnected from server`
})
</script>
