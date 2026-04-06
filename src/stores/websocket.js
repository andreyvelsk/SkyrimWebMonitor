import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import getWebSocketClient from '@/services/websocket'

export const useWebSocketStore = defineStore('websocket', () => {
  // State
  const status = ref('disconnected') // 'connecting', 'connected', 'disconnected'
  const messages = ref([])
  const error = ref(null)

  // Get WebSocket client instance
  const wsClient = getWebSocketClient()

  // Computed
  const isConnected = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting')
  const messageCount = computed(() => messages.value.length)

  // Methods
  const connect = async () => {
    try {
      status.value = 'connecting'
      error.value = null
      await wsClient.connect()
      status.value = 'connected'
    } catch (err) {
      status.value = 'disconnected'
      error.value = err.message || 'Failed to connect'
    }
  }

  const disconnect = () => {
    wsClient.disconnect()
    status.value = 'disconnected'
    messages.value = []
    error.value = null
  }

  const clearMessages = () => {
    messages.value = []
  }

  const addMessage = (message) => {
    const parsedMessage = typeof message === 'string' ? message : JSON.stringify(message)
    messages.value.push({
      id: Date.now(),
      content: parsedMessage,
      timestamp: new Date().toISOString(),
    })
  }

  const sendMessage = (message) => {
    return wsClient.send(message)
  }

  // Setup listeners
  wsClient.on('onOpen', () => {
    status.value = 'connected'
    error.value = null
  })

  wsClient.on('onClose', () => {
    status.value = 'disconnected'
  })

  wsClient.on('onError', (err) => {
    status.value = 'disconnected'
    error.value = err?.message || 'Connection error'
  })

  wsClient.on('onMessage', (data) => {
    addMessage(data)
  })

  return {
    // State
    status,
    messages,
    error,

    // Computed
    isConnected,
    isConnecting,
    messageCount,

    // Methods
    connect,
    disconnect,
    clearMessages,
    addMessage,
    sendMessage,
  }
})
