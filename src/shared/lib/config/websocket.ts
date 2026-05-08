const DEFAULT_WS_PORT = '8765';
const WS_ENDPOINT_STORAGE_KEY = 'skyrim-web-monitor-ws-endpoint';

export function getDefaultWsUrl(): string {
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:8765';
  }

  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

function getStoredWsUrl(): string | null {
  try {
    return localStorage.getItem(WS_ENDPOINT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeWsUrl(url: string): void {
  try {
    localStorage.setItem(WS_ENDPOINT_STORAGE_KEY, url);
  } catch {
    /* localStorage can be unavailable in restricted WebViews */
  }
}

export function normalizeWsUrl(rawUrl: string): string {
  const trimmedUrl = rawUrl.trim();

  if (!trimmedUrl) {
    return getDefaultWsUrl();
  }

  let candidateUrl = trimmedUrl;

  if (/^https?:\/\//i.test(candidateUrl)) {
    candidateUrl = candidateUrl.replace(/^http/i, 'ws');
  } else if (!/^wss?:\/\//i.test(candidateUrl)) {
    candidateUrl = `ws://${candidateUrl}`;
  }

  const parsedUrl = new URL(candidateUrl);

  if (parsedUrl.protocol !== 'ws:' && parsedUrl.protocol !== 'wss:') {
    throw new Error('WebSocket URL must start with ws:// or wss://');
  }

  if (!parsedUrl.port) {
    parsedUrl.port = DEFAULT_WS_PORT;
  }

  return parsedUrl.toString();
}

export function getConfiguredWsUrl(): string {
  const storedUrl = getStoredWsUrl();

  if (!storedUrl) {
    return getDefaultWsUrl();
  }

  try {
    return normalizeWsUrl(storedUrl);
  } catch {
    return getDefaultWsUrl();
  }
}

export function saveConfiguredWsUrl(rawUrl: string): string {
  const normalizedUrl = normalizeWsUrl(rawUrl);
  storeWsUrl(normalizedUrl);
  return normalizedUrl;
}

export const WS_CONFIG = {
  URL: getConfiguredWsUrl(),

  // Reconnection settings
  RECONNECT_INTERVAL: 3000, // ms
  MAX_RECONNECT_ATTEMPTS: 10,

  // Heartbeat settings - detects connection loss within ~10-15 seconds
  HEARTBEAT_INTERVAL: 2500, // ms (1 sec between heartbeat pings)
  // Timeout = 2x heartbeat interval (if no response in 10 sec, close connection)
};
