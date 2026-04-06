<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-4 border-b border-gray-200">
      <h2 class="text-lg font-semibold text-gray-900">
        Messages
        <span class="ml-2 text-sm text-gray-500">({{ wsStore.messageCount }})</span>
      </h2>
      <button
        v-if="wsStore.messageCount > 0"
        @click="clearMessages"
        class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Clear
      </button>
    </div>

    <!-- Messages List -->
    <div class="flex-1 overflow-y-auto p-4">
      <div v-if="wsStore.messages.length === 0" class="flex items-center justify-center h-full">
        <p class="text-gray-500 text-center">
          <span v-if="wsStore.isConnected">No messages yet</span>
          <span v-else>Connect to see messages</span>
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="message in wsStore.messages"
          :key="message.id"
          class="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          <!-- Message Timestamp -->
          <p class="text-xs text-gray-500 mb-1">
            {{ formatTime(message.timestamp) }}
          </p>

          <!-- Message Content -->
          <div class="break-words">
            <code class="text-sm text-gray-800 whitespace-pre-wrap font-mono">
              {{ message.content }}
            </code>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

const clearMessages = () => {
  wsStore.clearMessages()
}
</script>
