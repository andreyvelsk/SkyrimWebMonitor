/**
 * Temporary in-app debug log for endpoint auto-discovery.
 *
 * Collects `[discovery]` messages in a ring buffer so they can be rendered
 * directly in the UI (useful when Chrome remote debugging is unavailable).
 * Remove together with the debug overlay after the issue is resolved.
 */

type Listener = (lines: readonly string[]) => void;

const MAX_LINES = 60;

const lines: string[] = [];
const listeners = new Set<Listener>();

export function pushDiscoveryDebugLog(message: string): void {
  const stamp = new Date().toISOString().slice(11, 23);
  const line = `${stamp} ${message}`;

  lines.push(line);

  if (lines.length > MAX_LINES) {
    lines.shift();
  }

  for (const listener of listeners) {
    listener([...lines]);
  }
}

export function subscribeDiscoveryDebugLog(listener: Listener): () => void {
  listeners.add(listener);
  listener([...lines]);

  return () => {
    listeners.delete(listener);
  };
}
