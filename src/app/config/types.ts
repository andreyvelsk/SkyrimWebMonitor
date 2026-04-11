import type { Component } from 'vue';

export interface PageConfig {
  id: string;
  component: Component;
  fields: Record<string, string>;
  label: string;
}

export type PagesRegistry = Record<string, Record<string, PageConfig>>;
