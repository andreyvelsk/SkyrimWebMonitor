import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DiscoveryProgress } from '../lib/types';

// =============================================================
// discoverEndpoint tests
// =============================================================

vi.mock('../getLocalIp', () => ({
  getLocalIp: vi.fn(() => Promise.resolve('192.168.1.42')),
}));

const probeMock = vi.fn<(url: string) => Promise<boolean>>();

vi.mock('../probeEndpoint', () => ({
  probeEndpoint: (url: string, _timeoutMs: number, _signal?: AbortSignal) => probeMock(url),
}));

import { discoverEndpoint } from '../discoverEndpoint';

describe('discoverEndpoint', () => {
  beforeEach(() => {
    probeMock.mockReset();
  });

  it('returns the first reachable endpoint and stops probing', async () => {
    probeMock.mockImplementation((url: string) =>
      Promise.resolve(url === 'ws://192.168.1.10:8765')
    );

    const result = await discoverEndpoint({ concurrency: 4 });

    expect(result).toEqual({ found: true, url: 'ws://192.168.1.10:8765' });
    // The winning probe is the 12th candidate; in-flight probes from the
    // concurrency-4 pool may still complete before the pool settles.
    expect(probeMock).toHaveBeenCalledTimes(15);
    expect(probeMock).toHaveBeenCalledWith('ws://192.168.1.10:8765');
  });

  it('retries failed candidates in a second pass before giving up', async () => {
    probeMock.mockResolvedValue(false);

    const result = await discoverEndpoint({ concurrency: 8 });

    expect(result).toEqual({ found: false, url: null });
    // 256 candidates × 2 passes
    expect(probeMock).toHaveBeenCalledTimes(512);
  });

  it('finds a busy server on the retry pass', async () => {
    const attempts = new Map<string, number>();

    probeMock.mockImplementation((url: string) => {
      attempts.set(url, (attempts.get(url) ?? 0) + 1);
      // Every endpoint fails on its first attempt, succeeds on the second.
      return Promise.resolve((attempts.get(url) ?? 0) > 1);
    });

    const result = await discoverEndpoint({ concurrency: 4, ports: [8765] });

    expect(result.found).toBe(true);
    // localhost is retried first in the second pass
    expect(result.url).toBe('ws://localhost:8765');
  });

  it('does not retry when passes is 1', async () => {
    probeMock.mockResolvedValue(false);

    const result = await discoverEndpoint({ concurrency: 8, passes: 1 });

    expect(result).toEqual({ found: false, url: null });
    expect(probeMock).toHaveBeenCalledTimes(256);
  });

  it('reports progress with probed counts', async () => {
    probeMock.mockResolvedValue(false);

    const progressUpdates: DiscoveryProgress[] = [];
    await discoverEndpoint({
      concurrency: 8,
      onProgress: (progress) => progressUpdates.push({ ...progress }),
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0]).toMatchObject({ status: 'running', probed: 0, total: 256 });
    const last = progressUpdates[progressUpdates.length - 1];
    expect(last.probed).toBe(256);
  });

  it('resolves not-found immediately when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    const result = await discoverEndpoint({ signal: controller.signal });

    expect(result).toEqual({ found: false, url: null });
    expect(probeMock).not.toHaveBeenCalled();
  });

  it('stops early when aborted mid-scan', async () => {
    const controller = new AbortController();
    probeMock.mockImplementation(() => {
      controller.abort();
      return Promise.resolve(false);
    });

    const result = await discoverEndpoint({ concurrency: 4, signal: controller.signal });

    expect(result).toEqual({ found: false, url: null });
  });
});
