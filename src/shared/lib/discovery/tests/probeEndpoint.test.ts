import { describe, it, expect, vi, afterEach } from 'vitest';
import { probeEndpoint } from '../probeEndpoint';

// =============================================================
// probeEndpoint tests — controllable WebSocket mock
// =============================================================

type ProbeSocket = {
  url: string;
  onopen: (() => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  close: () => void;
  closed: boolean;
};

let lastSocket: ProbeSocket | null = null;
const sockets: ProbeSocket[] = [];

class ControllableWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    this.closed = false;
    sockets.push(this);
    lastSocket = this;
  }

  close(): void {
    this.closed = true;
  }
}

vi.stubGlobal('WebSocket', ControllableWebSocket);

function openLast(): void {
  lastSocket?.onopen?.();
}

function failLast(): void {
  lastSocket?.onerror?.();
}

afterEach(() => {
  sockets.length = 0;
  lastSocket = null;
});

describe('probeEndpoint', () => {
  it('resolves true when the socket opens', async () => {
    const promise = probeEndpoint('ws://localhost:8765', 1000);
    await Promise.resolve(); // let the constructor run
    openLast();

    await expect(promise).resolves.toBe(true);
    expect(lastSocket?.closed).toBe(true);
  });

  it('resolves false on error', async () => {
    const promise = probeEndpoint('ws://localhost:8765', 1000);
    await Promise.resolve();
    failLast();

    await expect(promise).resolves.toBe(false);
  });

  it('resolves false on timeout and closes the socket', async () => {
    vi.useFakeTimers();
    const promise = probeEndpoint('ws://localhost:8765', 50);
    await Promise.resolve();

    const resultPromise = vi.waitFor(() => promise, { timeout: 200 });
    vi.advanceTimersByTime(60);

    await expect(resultPromise).resolves.toBe(false);
    expect(lastSocket?.closed).toBe(true);
    vi.useRealTimers();
  });

  it('resolves false immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(probeEndpoint('ws://localhost:8765', 1000, controller.signal)).resolves.toBe(false);
  });

  it('resolves false when aborted mid-probe', async () => {
    const controller = new AbortController();
    const promise = probeEndpoint('ws://localhost:8765', 5000, controller.signal);
    await Promise.resolve();

    controller.abort();

    await expect(promise).resolves.toBe(false);
  });
});
