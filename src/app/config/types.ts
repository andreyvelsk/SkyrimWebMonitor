import type { Component } from 'vue';

export interface SubscriptionSettings {
  /** Push interval in milliseconds. */
  frequency?: number;
  /** Only push when values change. */
  sendOnChange?: boolean;
}

export interface PageSubscriptionConfig {
  id: string;
  fields: Record<string, string>;
  settings?: SubscriptionSettings;
}

export interface PageConfig {
  component: Component;
  /**
   * One or more subscriptions the page wants active while it is shown.
   * Most pages have a single entry; pages like the map use several
   * concurrent streams at different frequencies.
   */
  subscriptions?: PageSubscriptionConfig[];
}

export type PagesRegistry = Record<string, Record<string, PageConfig>>;

export interface CategorySubscriptionConfig {
  subscriptionId: string;
  fields: Record<string, string>;
}
