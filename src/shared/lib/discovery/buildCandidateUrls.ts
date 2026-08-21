/**
 * Builds the ordered list of WebSocket endpoint candidates to probe during
 * auto-discovery: localhost first, then every host of the local /24 subnet.
 */

const SUBNET_HOST_MIN = 1;
const SUBNET_HOST_MAX = 254;

function buildHostCandidates(localIp: string | null): string[] {
  const hosts = ['localhost', '127.0.0.1'];

  if (!localIp) {
    return hosts;
  }

  const octets = localIp.split('.');

  if (octets.length !== 4) {
    return hosts;
  }

  const prefix = `${octets[0]}.${octets[1]}.${octets[2]}`;

  for (let host = SUBNET_HOST_MIN; host <= SUBNET_HOST_MAX; host += 1) {
    hosts.push(`${prefix}.${host}`);
  }

  return hosts;
}

/**
 * @param localIp — the device's private LAN IPv4 address, or `null` when
 *                  undetectable (then only localhost candidates are built).
 * @param ports   — ports to probe on each host.
 */
export function buildCandidateUrls(
  localIp: string | null,
  ports: readonly number[]
): string[] {
  const urls: string[] = [];

  for (const host of buildHostCandidates(localIp)) {
    for (const port of ports) {
      urls.push(`ws://${host}:${port}`);
    }
  }

  return urls;
}
