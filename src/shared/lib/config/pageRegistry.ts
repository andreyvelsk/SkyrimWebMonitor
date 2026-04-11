/**
 * Unified Pages Registry
 *
 * Single source of truth for page components and data subscriptions.
 * Combines page components, field mappings, and metadata in one structure.
 *
 * NOTE: This is the registry of AVAILABLE pages and their configurations.
 * Navigation structure (which pages are shown and in what order) is defined separately
 * in useNavigationStore for flexibility (pages can be hidden, reordered, renamed, etc).
 *
 * Structure: { [tab]: { [subTab]: { component, fields, label } } }
 */

import type { Component } from 'vue';
import {
  Stats,
  Weapons,
  Armor,
} from '@/pages';

export interface PageConfig {
  id: string; // subscription id in format: tab.subtab
  component: Component;
  fields: Record<string, string>;
  label: string;
}

export type PagesRegistry = Record<string, Record<string, PageConfig>>;

export const pagesRegistry: PagesRegistry = {
  character: {
    stats: {
      id: 'character.stats',
      component: Stats,
      label: 'Stats',
      fields: {
        health: 'ActorValue::kHealth',
        magicka: 'ActorValue::kMagicka',
        stamina: 'ActorValue::kStamina',
        healthBase: 'ActorValue::kHealth::Base',
        magickaBase: 'ActorValue::kMagicka::Base',
        staminaBase: 'ActorValue::kStamina::Base',
        level: 'Player::Level',
        xp: 'Player::XP::Current',
        xpNext: 'Player::XP::Next',
        inventoryWeight: 'Player::InventoryWeight',
        carryWeight: 'Player::CarryWeight',
        gold: 'Inventory::Gold',
      },
    },
  },

  inventory: {
    weapons: {
      id: 'inventory.weapons',
      component: Weapons,
      label: 'Weapons',
      fields: {
        categories: 'Inventory::Categories',
        items: 'Inventory::Items::Weapons',
      },
    },
    apparel: {
      id: 'inventory.apparel',
      component: Armor,
      label: 'Apparel',
      fields: {
        categories: 'Inventory::Categories',
        items: 'Inventory::Items::Apparel',
      },
    },
  },
};

/**
 * Get page configuration by tab and subTab
 */
export function getPageConfig(tab: string, subTab: string): PageConfig | null {
  return pagesRegistry[tab]?.[subTab] ?? null;
}

/**
 * Get subscription ID for a page
 */
export function getPageSubscriptionId(tab: string, subTab: string): string | null {
  return getPageConfig(tab, subTab)?.id ?? null;
}

/**
 * Get page component by tab and subTab
 */
export function getPageComponent(tab: string, subTab: string): Component | null {
  return getPageConfig(tab, subTab)?.component ?? null;
}

/**
 * Get field mapping for a specific page
 */
export function getPageFields(tab: string, subTab: string): Record<string, string> {
  return getPageConfig(tab, subTab)?.fields ?? {};
}

/**
 * Get default fields (when no page is selected)
 */
export function getDefaultFields(): Record<string, string> {
  return getPageFields('character', 'stats');
}
