import type { Component } from 'vue';
import { getPageComponent } from '@/shared/lib/config/pageRegistry';

type PageComponent = Component | null;

/**
 * Get page component by tab and subTab
 */
export function usePageRouter(tab: string, subTab: string): PageComponent {
  return getPageComponent(tab, subTab);
}
