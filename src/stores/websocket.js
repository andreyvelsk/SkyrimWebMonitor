import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import getWebSocketClient from '@/services/websocket'
import { CONNECTION_STATUS } from '@/constants/connection'
import { useMonitorStore } from './use-monitor-state/useMonitorStore'

export const useWebSocketStore = defineStore('websocket', () => {
  const monitorStore = useMonitorStore()
  const { setGeneralState } = monitorStore
  // State
  const status = ref(CONNECTION_STATUS.DISCONNECTED)
  const error = ref(null)

  // Get WebSocket client instance
  const wsClient = getWebSocketClient()

  // Computed
  const isConnected = computed(() => status.value === CONNECTION_STATUS.CONNECTED)
  const isConnecting = computed(
    () =>
      status.value === CONNECTION_STATUS.CONNECTING ||
      status.value === CONNECTION_STATUS.RECONNECTING
  )

  // Methods
  const connect = async () => {
    try {
      status.value = CONNECTION_STATUS.CONNECTING
      error.value = null
      await wsClient.connect()
      status.value = CONNECTION_STATUS.CONNECTED
    } catch (err) {
      status.value = CONNECTION_STATUS.DISCONNECTED
      error.value = err.message || 'Failed to connect'
    }
  }

  const disconnect = () => {
    wsClient.disconnect()
    status.value = CONNECTION_STATUS.DISCONNECTED
    error.value = null
  }

  const sendMessage = (message) => {
    return wsClient.send(message)
  }

  // Setup listeners
  wsClient.on('onOpen', () => {
    status.value = CONNECTION_STATUS.CONNECTED
    error.value = null
  })

  wsClient.on('onClose', () => {
    status.value = CONNECTION_STATUS.DISCONNECTED
  })

  wsClient.on('onError', (err) => {
    status.value = CONNECTION_STATUS.DISCONNECTED
    error.value = err?.message || 'Connection error'
  })

  wsClient.on('onMessage', (data) => {
    setGeneralState(data);
  })

  return {
    // State
    status,
    error,

    // Computed
    isConnected,
    isConnecting,

    // Methods
    connect,
    disconnect,
    sendMessage,
  }
})
