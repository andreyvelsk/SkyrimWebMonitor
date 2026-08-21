/**
 * Types for the custom Capacitor NetworkInfo plugin.
 */

export interface NetworkInfoPlugin {
  getLocalIps(): Promise<{ ips: string[] }>;
}