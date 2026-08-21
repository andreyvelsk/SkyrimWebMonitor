import type { DiscoveryProgress } from '@/shared/lib/discovery';

export interface Subscription {
  id: string;
  fieldMapping: Record<string, string>;
  frequency: number;
}

export type { DiscoveryProgress };
