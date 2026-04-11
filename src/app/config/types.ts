import type { Component } from 'vue';

export interface PageConfig {
  id: string;
  component: Component;
  fields: Record<string, string>;
}

export type PagesRegistry = Record<string, Record<string, PageConfig>>;

export interface CategorySubscriptionConfig {
  subscriptionId: string;
  fields: Record<string, string>;
}
