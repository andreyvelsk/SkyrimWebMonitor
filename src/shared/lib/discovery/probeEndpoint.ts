/**
 * Single WebSocket endpoint probe with a timeout.
 *
 * Resolves `true` when the socket opens, `false` on error/close/timeout or
 * when the abort signal fires. Always cleans up handlers and closes the
 * socket.
 */

export function probeEndpoint(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<boolean> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve(false);
      return;
    }

    let settled = false;

    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      finish(false);
    }, timeoutMs);

    function onAbort(): void {
      finish(false);
    }

    function finish(result: boolean): void {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);

      socket.onopen = null;
      socket.onerror = null;
      socket.onclose = null;

      try {
        socket.close();
      } catch {
        /* socket may already be closed */
      }

      resolve(result);
    }

    socket.onopen = () => {
      finish(true);
    };
    socket.onerror = () => {
      finish(false);
    };
    socket.onclose = () => {
      finish(false);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
