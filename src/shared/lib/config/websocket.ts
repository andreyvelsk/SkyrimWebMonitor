// WebSocket Configuration

function getWsUrl(): string {
  if (import.meta.env.PROD) {
    // Production: connect directly using env variable
    return import.meta.env.VITE_WS_URL || 'ws://localhost:8765';
  }
  // Development: route through Vite proxy (/ws path) to avoid CORS origin issues
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

export const WS_CONFIG = {
  URL: getWsUrl(),

  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // ms
  MAX_RECONNECT_ATTEMPTS: 10,

  // Heartbeat settings - detects connection loss within ~10-15 seconds
  HEARTBEAT_INTERVAL: 1000, // ms (1 sec between heartbeat pings)
  // Timeout = 2x heartbeat interval (if no response in 10 sec, close connection)
};
