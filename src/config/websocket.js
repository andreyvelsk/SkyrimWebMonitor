// WebSocket Configuration
export const WS_CONFIG = {
  // WebSocket server URL
  // Change this to your actual server address
  URL: import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8765',

  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // ms
  MAX_RECONNECT_ATTEMPTS: 10,

  // Message settings
  HEARTBEAT_INTERVAL: 30000, // ms
  MESSAGE_TIMEOUT: 5000, // ms
}
