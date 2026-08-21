/**
 * WebSocket endpoint auto-discovery orchestrator.
 *
 * Probes candidate URLs (localhost first, then the local /24 subnet) with a
 * bounded-concurrency worker pool. The first reachable endpoint wins.
 *
 * Candidates that fail are retried in a second pass: a busy game server may
 * miss its handshake deadline under the burst of parallel probes, so a single
 * pass can mark a live endpoint as unreachable.
 */

import { buildCandidateUrls } from './buildCandidateUrls';
import { getLocalIp } from './getLocalIp';
import { probeEndpoint } from './probeEndpoint';
import { logger } from '@/shared/lib/utils/logger';
import { pushDiscoveryDebugLog } from './lib/debugLog';
import type { DiscoveryOptions, DiscoveryProgress, DiscoveryResult } from './lib/types';

const DEFAULT_PORTS: readonly number[] = [8765];
const DEFAULT_CONCURRENCY = 32;
// A real WS handshake on a LAN completes well under 100ms, so the first pass
// uses a short timeout to sweep the whole /24 in a few seconds. Hosts that
// miss it (busy server, slow radio) get a second pass with a long timeout.
const DEFAULT_PROBE_TIMEOUT_MS = 400;
const DEFAULT_RETRY_PROBE_TIMEOUT_MS = 1500;
const DEFAULT_PASSES = 2;

// TODO(debug): remove logging together with the in-app debug overlay.
function debugLog(message: string): void {
  logger.log(`[discovery] ${message}`);
  pushDiscoveryDebugLog(message);
}

function createProgress(total: number): DiscoveryProgress {
  return { status: 'running', probed: 0, total, currentCandidate: null };
}

export async function discoverEndpoint(
  options: DiscoveryOptions = {}
): Promise<DiscoveryResult> {
  const ports = options.ports ?? DEFAULT_PORTS;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const probeTimeoutMs = options.probeTimeoutMs ?? DEFAULT_PROBE_TIMEOUT_MS;
  const retryProbeTimeoutMs = options.retryProbeTimeoutMs ?? DEFAULT_RETRY_PROBE_TIMEOUT_MS;
  const passes = options.passes ?? DEFAULT_PASSES;
  const signal = options.signal;

  if (signal?.aborted) {
    return { found: false, url: null };
  }

  const localIp = await getLocalIp();
  const candidates = buildCandidateUrls(localIp, ports);

  debugLog(
    `start: localIp=${localIp ?? 'unknown'}, candidates=${candidates.length}, concurrency=${concurrency}, timeout=${probeTimeoutMs}ms, retryTimeout=${retryProbeTimeoutMs}ms, passes=${passes}`
  );

  const progress = createProgress(candidates.length);
  options.onProgress?.({ ...progress });

  return new Promise<DiscoveryResult>((resolve) => {
    let queue = candidates;
    let nextIndex = 0;
    let probedInPass = 0;
    let pass = 1;
    let settled = false;
    const failedUrls = new Set<string>();

    function finish(result: DiscoveryResult): void {
      if (settled) {
        return;
      }

      settled = true;
      signal?.removeEventListener('abort', onAbort);
      debugLog(`finish: ${result.found ? `found ${result.url}` : 'not found'}`);
      resolve(result);
    }

    function onAbort(): void {
      finish({ found: false, url: null });
    }

    signal?.addEventListener('abort', onAbort, { once: true });

    function startNextPass(): boolean {
      if (pass >= passes || failedUrls.size === 0 || signal?.aborted) {
        return false;
      }

      queue = [...failedUrls];
      failedUrls.clear();
      nextIndex = 0;
      probedInPass = 0;
      progress.probed = 0;
      pass += 1;
      debugLog(`retry pass ${pass}: ${queue.length} candidates`);

      const workers = Math.min(concurrency, queue.length);

      for (let i = 0; i < workers; i += 1) {
        runWorker();
      }

      return true;
    }

    function runWorker(): void {
      if (settled || nextIndex >= queue.length) {
        return;
      }

      // A single worker handles one probe at a time; completion of a probe
      // schedules the next one via the `then` callback below.
      const url = queue[nextIndex];
      nextIndex += 1;
      const startedAt = Date.now();
      const timeoutMs = pass === 1 ? probeTimeoutMs : retryProbeTimeoutMs;

      void probeEndpoint(url, timeoutMs, signal).then((reachable) => {
        probedInPass += 1;
        progress.probed = probedInPass;

        debugLog(
          `${url} -> ${reachable ? 'open' : 'fail'} in ${Date.now() - startedAt}ms (pass ${pass}, ${progress.probed}/${queue.length})`
        );

        if (reachable) {
          finish({ found: true, url });
          return;
        }

        failedUrls.add(url);
        options.onProgress?.({ ...progress });

        if (progress.probed >= queue.length) {
          if (!startNextPass()) {
            finish({ found: false, url: null });
          }

          return;
        }

        runWorker();
      });
    }

    if (queue.length === 0) {
      finish({ found: false, url: null });
      return;
    }

    const initialWorkers = Math.min(concurrency, queue.length);

    for (let i = 0; i < initialWorkers; i += 1) {
      runWorker();
    }
  });
}
