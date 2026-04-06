<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 class="text-3xl font-bold text-gray-900">SkyrimWebMonitor</h1>
        <p class="text-gray-500 text-sm mt-1">WebSocket Real-time Monitoring</p>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <!-- Connection Status -->
      <div class="mb-6">
        <ConnectionStatus />
      </div>

      <!-- Messages Grid -->
      <div class="grid grid-cols-1 gap-6">
        <Messages />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useWebSocketStore } from '@/stores/websocket'
import ConnectionStatus from '@/components/ConnectionStatus.vue'
import Messages from '@/components/Messages.vue'

const wsStore = useWebSocketStore()

// Connect to WebSocket on component mount
onMounted(() => {
  wsStore.connect()
})
</script>
