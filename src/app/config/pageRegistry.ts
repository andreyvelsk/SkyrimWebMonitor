import type { Component } from 'vue';
import type { PageConfig, PagesRegistry, CategorySubscriptionConfig } from './types';
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
} from '@/pages';

const INVENTORY_FREQUENCY = 500; // ms

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
    hotkeys: {
      id: 'hotkeys.items',
      component: TheHotkeys,
      fields: {
        items: 'Hotkey::Items',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
  },

  inventory: {
    weapons: {
      id: 'inventory.weapons',
      component: TheWeapons,
      fields: {
        items: 'Inventory::Items::Weapons',
        ammo: 'Inventory::Items::Ammo',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    apparel: {
      id: 'inventory.apparel',
      component: TheApparel,
      fields: {
        items: 'Inventory::Items::Apparel',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    food: {
      id: 'inventory.food',
      component: TheFood,
      fields: {
        items: 'Inventory::Items::Food',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    potions: {
      id: 'inventory.potions',
      component: ThePotions,
      fields: {
        items: 'Inventory::Items::Potions',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    ingredients: {
      id: 'inventory.ingredients',
      component: TheIngredients,
      fields: {
        items: 'Inventory::Items::Ingredients',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    scrolls: {
      id: 'inventory.scrolls',
      component: TheScrolls,
      fields: {
        items: 'Inventory::Items::Scrolls',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    keys: {
      id: 'inventory.keys',
      component: TheKeys,
      fields: {
        items: 'Inventory::Items::Keys',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    books: {
      id: 'inventory.books',
      component: TheBooks,
      fields: {
        items: 'Inventory::Items::Books',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    misc: {
      id: 'inventory.misc',
      component: TheMisc,
      fields: {
        items: 'Inventory::Items::Misc',
        gems: 'Inventory::Items::SoulGems',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
  },

  magic: {
    destruction: {
      id: 'magic.destruction',
      component: TheDestruction,
      fields: {
        items: 'Magic::Items::Destruction',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    alteration: {
      id: 'magic.alteration',
      component: TheAlteration,
      fields: {
        items: 'Magic::Items::Alteration',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    conjuration: {
      id: 'magic.conjuration',
      component: TheConjuration,
      fields: {
        items: 'Magic::Items::Conjuration',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    illusion: {
      id: 'magic.illusion',
      component: TheIllusion,
      fields: {
        items: 'Magic::Items::Illusion',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
    },
    restoration: {
      id: 'magic.restoration',
      component: TheRestoration,
      fields: {
        items: 'Magic::Items::Restoration',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }

    },
    enchanting: {
      id: 'magic.enchanting',
      component: TheEnchanting,
      fields: {
        items: 'Magic::Items::Enchanting',
      },
      settings: {
        frequency: INVENTORY_FREQUENCY,
      }
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

export function getPageSubscriptionId(tab: string, subTab: string): string | null {
  return getPageConfig(tab, subTab)?.id ?? null;
}

export function getPageComponent(tab: string, subTab: string): Component | null {
  return getPageConfig(tab, subTab)?.component ?? null;
}

export function getPageFields(tab: string, subTab: string): Record<string, string> {
  return getPageConfig(tab, subTab)?.fields ?? {};
}

export function getPageSettings(tab: string, subTab: string): PageConfig['settings'] {
  return getPageConfig(tab, subTab)?.settings;
}
