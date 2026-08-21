/**
 * Temporary debug helper: detects the local IPv4 address and prints the
 * detected subnet to the console.
 *
 * Priority:
 * 1. Capacitor native plugin (NetworkInfo) — reliable on Android builds.
 * 2. WebRTC ICE host candidates — browser fallback.
 *
 * TODO(debug): remove this file and the call in App.vue after verification.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import type { NetworkInfoPlugin } from './lib/types';

const NetworkInfo = registerPlugin<NetworkInfoPlugin>('NetworkInfo');

const IPV4_HOST_CANDIDATE_REGEX = /candidate:.*\s(\d{1,3}(?:\.\d{1,3}){3})\s.*\styp\shost/g;

const CANDIDATE_WAIT_TIMEOUT_MS = 3000;
const CANDIDATE_POLL_INTERVAL_MS = 50;

function isPrivateIpv4(ip: string): boolean {
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

function extractHostCandidates(sdp: string): string[] {
  const candidates: string[] = [];
  const matches = sdp.matchAll(IPV4_HOST_CANDIDATE_REGEX);

  for (const match of matches) {
    const ip = match[1];
    if (ip && isPrivateIpv4(ip) && !candidates.includes(ip)) {
      candidates.push(ip);
    }
  }

  return candidates;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getLocalIpFromCapacitor(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const { ips } = await NetworkInfo.getLocalIps();
    return ips.find((ip) => isPrivateIpv4(ip)) ?? null;
  } catch {
    return null;
  }
}

function getLocalIpFromLocationHostname(): string | null {
  const hostname = window.location.hostname;

  if (isPrivateIpv4(hostname)) {
    return hostname;
  }

  return null;
}

async function getLocalIpFromWebRtc(): Promise<string | null> {
  const pc = new RTCPeerConnection({ iceServers: [] });

  try {
    pc.createDataChannel('local-ip-probe');

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Candidate gathering is asynchronous — poll until host candidates appear
    // or the timeout elapses.
    const deadline = Date.now() + CANDIDATE_WAIT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const sdp = pc.localDescription?.sdp ?? '';
      const candidates = extractHostCandidates(sdp);

      if (candidates.length > 0) {
        return candidates[0];
      }

      await sleep(CANDIDATE_POLL_INTERVAL_MS);
    }

    return null;
  } catch {
    return null;
  } finally {
    pc.close();
  }
}

export async function getLocalIp(): Promise<string | null> {
  const capacitorIp = await getLocalIpFromCapacitor();

  if (capacitorIp) {
    return capacitorIp;
  }

  const locationIp = getLocalIpFromLocationHostname();

  if (locationIp) {
    return locationIp;
  }

  return getLocalIpFromWebRtc();
}

export function getSubnet(ip: string): string {
  const octets = ip.split('.');

  if (octets.length !== 4) {
    return ip;
  }

  return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`;
}

export async function debugPrintLocalSubnet(): Promise<void> {
  const ip = await getLocalIp();

  if (ip) {
    // eslint-disable-next-line no-console
    console.log(`[discovery-debug] Local IP: ${ip}`);
    // eslint-disable-next-line no-console
    console.log(`[discovery-debug] Subnet: ${getSubnet(ip)}`);
  } else {
     
    console.warn('[discovery-debug] Local IP not detected (native plugin and WebRTC unavailable)');
  }
}