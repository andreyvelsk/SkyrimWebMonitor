import type { Component } from 'vue';
import type { PageConfig, PagesRegistry } from './types';
import {
  Stats,
  Weapons,
  Armor,
} from '@/pages';

export type { PageConfig, PagesRegistry } from './types';

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

export function getPageConfig(tab: string, subTab: string): PageConfig | null {
  return pagesRegistry[tab]?.[subTab] ?? null;
}

export function getPageSubscriptionId(tab: string, subTab: string): string | null {
  return getPageConfig(tab, subTab)?.id ?? null;
}

export function getPageComponent(tab: string, subTab: string): Component | null {
  return getPageConfig(tab, subTab)?.component ?? null;
}

export function getPageFields(tab: string, subTab: string): Record<string, string> {
  return getPageConfig(tab, subTab)?.fields ?? {};
}
