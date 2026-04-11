import type { Component } from 'vue';
import { getPageComponent } from '@/app/config/pageRegistry';

export function usePageRouter(tab: string, subTab: string): Component | null {
  return getPageComponent(tab, subTab);
}
