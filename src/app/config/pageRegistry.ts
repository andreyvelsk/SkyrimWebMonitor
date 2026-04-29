import type { Component } from 'vue';
import type {
  PageConfig,
  PagesRegistry,
  CategorySubscriptionConfig,
  PageSubscriptionConfig,
} from './types';
import {
  TheStats,
  TheHotkeys,
  TheWeapons,
  TheApparel,
  TheMisc,
  ThePotions,
  TheFood,
  TheIngredients,
  TheScrolls,
  TheKeys,
  TheBooks,
  TheDestruction,
  TheAlteration,
  TheConjuration,
  TheIllusion,
  TheRestoration,
  TheEnchanting,
  TheMap,
} from '@/pages';

const INVENTORY_FREQUENCY = 200; // ms

export type { PageConfig, PagesRegistry, CategorySubscriptionConfig } from './types';

export const pagesRegistry: PagesRegistry = {
  character: {
    stats: {
      component: TheStats,
      subscriptions: [
        {
          id: 'character.stats',
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
      ],
    },
    hotkeys: {
      component: TheHotkeys,
      subscriptions: [
        {
          id: 'hotkeys.items',
          fields: {
            items: 'Hotkey::Items',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
  },

  inventory: {
    weapons: {
      component: TheWeapons,
      subscriptions: [
        {
          id: 'inventory.weapons',
          fields: {
            items: 'Inventory::Items::Weapons',
            ammo: 'Inventory::Items::Ammo',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    apparel: {
      component: TheApparel,
      subscriptions: [
        {
          id: 'inventory.apparel',
          fields: {
            items: 'Inventory::Items::Apparel',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    food: {
      component: TheFood,
      subscriptions: [
        {
          id: 'inventory.food',
          fields: {
            items: 'Inventory::Items::Food',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    potions: {
      component: ThePotions,
      subscriptions: [
        {
          id: 'inventory.potions',
          fields: {
            items: 'Inventory::Items::Potions',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    ingredients: {
      component: TheIngredients,
      subscriptions: [
        {
          id: 'inventory.ingredients',
          fields: {
            items: 'Inventory::Items::Ingredients',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    scrolls: {
      component: TheScrolls,
      subscriptions: [
        {
          id: 'inventory.scrolls',
          fields: {
            items: 'Inventory::Items::Scrolls',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    keys: {
      component: TheKeys,
      subscriptions: [
        {
          id: 'inventory.keys',
          fields: {
            items: 'Inventory::Items::Keys',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    books: {
      component: TheBooks,
      subscriptions: [
        {
          id: 'inventory.books',
          fields: {
            items: 'Inventory::Items::Books',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    misc: {
      component: TheMisc,
      subscriptions: [
        {
          id: 'inventory.misc',
          fields: {
            items: 'Inventory::Items::Misc',
            gems: 'Inventory::Items::SoulGems',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
  },

  magic: {
    destruction: {
      component: TheDestruction,
      subscriptions: [
        {
          id: 'magic.destruction',
          fields: {
            items: 'Magic::Items::Destruction',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    alteration: {
      component: TheAlteration,
      subscriptions: [
        {
          id: 'magic.alteration',
          fields: {
            items: 'Magic::Items::Alteration',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    conjuration: {
      component: TheConjuration,
      subscriptions: [
        {
          id: 'magic.conjuration',
          fields: {
            items: 'Magic::Items::Conjuration',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    illusion: {
      component: TheIllusion,
      subscriptions: [
        {
          id: 'magic.illusion',
          fields: {
            items: 'Magic::Items::Illusion',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    restoration: {
      component: TheRestoration,
      subscriptions: [
        {
          id: 'magic.restoration',
          fields: {
            items: 'Magic::Items::Restoration',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
    enchanting: {
      component: TheEnchanting,
      subscriptions: [
        {
          id: 'magic.enchanting',
          fields: {
            items: 'Magic::Items::Enchanting',
          },
          settings: {
            frequency: INVENTORY_FREQUENCY,
          },
        },
      ],
    },
  },

  map: {
    view: {
      component: TheMap,
      subscriptions: [
        {
          id: 'map.player',
          fields: {
            position: 'Player::Position',
          },
          settings: {
            frequency: 50,
          },
        },
        {
          id: 'map.hotspots',
          fields: {
            hot: 'Map::Markers',
          },
          settings: {
            frequency: 1000,
          },
        },
      ],
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
  magic: {
    subscriptionId: 'magic.categories',
    fields: {
      categories: 'Magic::Categories',
    },
  },
};

export function getTabCategorySubscription(tabId: string): CategorySubscriptionConfig | null {
  return TAB_CATEGORY_SUBSCRIPTIONS[tabId] ?? null;
}

export function getPageConfig(tab: string, subTab: string): PageConfig | null {
  return pagesRegistry[tab]?.[subTab] ?? null;
}

/**
 * Resolve all subscriptions a page wants active. Pages declare them via
 * the `subscriptions` array; most have one entry, the map page has several
 * concurrent streams at different frequencies.
 */
export function getPageSubscriptions(tab: string, subTab: string): PageSubscriptionConfig[] {
  return getPageConfig(tab, subTab)?.subscriptions ?? [];
}

export function getPageComponent(tab: string, subTab: string): Component | null {
  return getPageConfig(tab, subTab)?.component ?? null;
}
