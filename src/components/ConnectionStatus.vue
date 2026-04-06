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

    <!-- Close Button (optional) -->
    <button
      v-if="wsStore.isConnected"
      @click="disconnect"
      class="flex-shrink-0 px-2 py-1 text-xs font-medium rounded bg-opacity-20 hover:bg-opacity-30 transition-all"
    >
      Disconnect
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()

const statusText = computed(() => {
  if (wsStore.isConnected) return 'Connected to server'
  if (wsStore.isConnecting) return 'Connecting to server...'
  return 'Disconnected from server'
})

const disconnect = () => {
  wsStore.disconnect()
}
</script>
