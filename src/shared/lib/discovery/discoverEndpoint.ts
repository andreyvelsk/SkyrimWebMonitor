/**
 * WebSocket endpoint auto-discovery orchestrator.
 *
 * Probes candidate URLs (localhost first, then the local /24 subnet) with a
 * bounded-concurrency worker pool. The first reachable endpoint wins; all
 * remaining probes are aborted.
 */

import { buildCandidateUrls } from './buildCandidateUrls';
import { getLocalIp } from './getLocalIp';
import { probeEndpoint } from './probeEndpoint';
import type { DiscoveryOptions, DiscoveryProgress, DiscoveryResult } from './lib/types';

const DEFAULT_PORTS: readonly number[] = [8765];
const DEFAULT_CONCURRENCY = 32;
const DEFAULT_PROBE_TIMEOUT_MS = 1500;

function createProgress(total: number): DiscoveryProgress {
  return { status: 'running', probed: 0, total, currentCandidate: null };
}

export async function discoverEndpoint(
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const ports = options.ports ?? DEFAULT_PORTS;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const probeTimeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const signal = options.signal;

  if (signal?.aborted) {
    return { found: false, url: null };
  }

  const localIp = await getLocalIp();
  const candidates = buildCandidateUrls(localIp, ports);

  let probed = 0;
  const progress = createProgress(candidates.length);
  options.onProgress?.({ ...progress });

  return new Promise<DiscoveryResult>((resolve) => {
    let nextIndex = 0;
    let settled = false;

    function finish(result: DiscoveryResult): void {
      if (settled) {
        return;
      }

      settled = true;
      signal?.removeEventListener('abort', onAbort);
      resolve(result);
    }

    function onAbort(): void {
      finish({ found: false, url: null });
    }

    signal?.addEventListener('abort', onAbort, { once: true });

    function runWorker(): void {
      if (settled || nextIndex >= candidates.length) {
        return;
      }

      // A single worker handles one probe at a time; completion of a probe
      // schedules the next one via the `then` callback below.
      const url = candidates[nextIndex];
      nextIndex += 1;

      void probeEndpoint(url, probeTimeoutMs, signal).then((reachable) => {
        probed += 1;
        progress.probed = probed;

        if (reachable) {
          finish({ found: true, url });
          return;
        }

        options.onProgress?.({ ...progress });

        if (probed >= candidates.length) {
          finish({ found: false, url: null });
          return;
        }

        runWorker();
      });
    }

    const initialWorkers = Math.min(concurrency, candidates.length);

    for (let i = 0; i < initialWorkers; i += 1) {
      runWorker();
    }
  });
}
