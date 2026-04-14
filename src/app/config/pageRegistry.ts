import type { Component } from 'vue';
import type { PageConfig, PagesRegistry, CategorySubscriptionConfig } from './types';
import {
  TheStats,
  TheWeapons,
  TheApparel,
  TheMisc,
  ThePotions,
  TheFood,
  TheIngredients,
  TheScrolls,
  TheKeys,
  TheBooks,
} from '@/pages';

export type { PageConfig, PagesRegistry, CategorySubscriptionConfig } from './types';

export const pagesRegistry: PagesRegistry = {
  character: {
    stats: {
      id: 'character.stats',
      component: TheStats,
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
      component: TheWeapons,
      fields: {
        items: 'Inventory::Items::Weapons',
      },
    },
    apparel: {
      id: 'inventory.apparel',
      component: TheApparel,
      fields: {
        items: 'Inventory::Items::Apparel',
      },
    },
    food: {
      id: 'inventory.food',
      component: TheFood,
      fields: {
        items: 'Inventory::Items::Food',
      },
    },
    potions: {
      id: 'inventory.potions',
      component: ThePotions,
      fields: {
        items: 'Inventory::Items::Potions',
      },
    },
    ingredients: {
      id: 'inventory.ingredients',
      component: TheIngredients,
      fields: {
        items: 'Inventory::Items::Ingredients',
      },
    },
    scrolls: {
      id: 'inventory.scrolls',
      component: TheScrolls,
      fields: {
        items: 'Inventory::Items::Scrolls',
      },
    },
    keys: {
      id: 'inventory.keys',
      component: TheKeys,
      fields: {
        items: 'Inventory::Items::Keys',
      },
    },
    books: {
      id: 'inventory.books',
      component: TheBooks,
      fields: {
        items: 'Inventory::Items::Books',
      },
    },
    misc: {
      id: 'inventory.misc',
      component: TheMisc,
      fields: {
        items: 'Inventory::Items::Misc',
      },
    },
  },
};

/**
 * Tabs that require a separate category subscription to populate their subTabs dynamically.
 * Key is the tab id, value is the subscription configuration.
 */
export const TAB_CATEGORY_SUBSCRIPTIONS: Record<string, CategorySubscriptionConfig> = {
  inventory: {
    subscriptionId: 'inventory.categories',
    fields: {
      categories: 'Inventory::Categories',
    },
  },
};

export function getTabCategorySubscription(tabId: string): CategorySubscriptionConfig | null {
  return TAB_CATEGORY_SUBSCRIPTIONS[tabId] ?? null;
}

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
