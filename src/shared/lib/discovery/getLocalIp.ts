/**
 * Local IP detection for WebSocket endpoint auto-discovery.
 *
 * Uses the custom Capacitor native plugin (NetworkInfo) — reliable on Android
 * builds. Returns `null` outside the native platform or when detection fails.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { logger } from '@/shared/lib/utils/logger';
import { pushDiscoveryDebugLog } from './lib/debugLog';
import type { NetworkInfoPlugin } from './lib/types';

const NetworkInfo = registerPlugin<NetworkInfoPlugin>('NetworkInfo');

export function isPrivateIpv4(ip: string): boolean {
  const octets = ip.split('.').map(Number);

  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;

  return (
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

/** Returns the device's private LAN IPv4 address, or `null` if undetectable. */
export async function getLocalIp(): Promise<string | null> {
  // TODO(debug): remove logging together with the in-app debug overlay.
  function debugLog(message: string): void {
    logger.log(`[discovery] ${message}`);
    pushDiscoveryDebugLog(message);
  }

  if (!Capacitor.isNativePlatform()) {
    debugLog('getLocalIp: not a native platform');
    return null;
  }

  try {
    const { ips } = await NetworkInfo.getLocalIps();
    debugLog(`getLocalIp: plugin reported [${ips.join(', ')}]`);

    const ip = ips.find((candidate) => isPrivateIpv4(candidate)) ?? null;
    debugLog(`getLocalIp: selected ${ip ?? 'none'}`);

    return ip;
  } catch (error) {
    debugLog(`getLocalIp: plugin error: ${String(error)}`);
    return null;
  }
}
