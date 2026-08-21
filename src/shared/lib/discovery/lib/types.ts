/**
 * Types for WebSocket endpoint auto-discovery.
 */

/** Custom Capacitor plugin exposing the device's local IPv4 addresses. */
export interface NetworkInfoPlugin {
  getLocalIps(): Promise<{ ips: string[] }>;
}

export type DiscoveryStatus = 'idle' | 'running' | 'found' | 'not-found';

export interface DiscoveryProgress {
  status: DiscoveryStatus;
  probed: number;
  total: number;
  currentCandidate: string | null;
}

export interface DiscoveryResult {
  found: boolean;
  url: string | null;
}

export interface DiscoveryOptions {
  /** Ports to probe on each host. Defaults to the app's default WS port. */
  ports?: readonly number[];
  /** Max parallel probes. */
  concurrency?: number;
  /** Per-probe timeout in milliseconds. */
  probeTimeoutMs?: number;
  /** Number of full passes over failed candidates (retry pass for busy servers). */
  passes?: number;
  /** Progress callback invoked as candidates are probed. */
  onProgress?: (progress: DiscoveryProgress) => void;
  /** Cancellation signal. */
  signal?: AbortSignal;
}
