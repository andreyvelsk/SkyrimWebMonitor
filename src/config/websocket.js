// WebSocket Configuration
export const WS_CONFIG = {
  // WebSocket server URL
  // In development: uses Vite proxy (/ws) to reach the real server
  // Production: uses VITE_WS_URL or defaults to localhost
  URL: import.meta.env.DEV ? 'ws://localhost:5173/ws' : (import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8765'),

  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // ms
  MAX_RECONNECT_ATTEMPTS: 10,

  // Message settings
  HEARTBEAT_INTERVAL: 30000, // ms
  MESSAGE_TIMEOUT: 5000, // ms
}
