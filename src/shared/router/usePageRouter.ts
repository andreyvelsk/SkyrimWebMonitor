import type { Component } from 'vue';
import {
  Stats,
  Skills,
  Perks,
  Status,
  Weapons,
  Armor,
  Potions,
  Misc,
  Spells,
  Powers,
  Shouts,
  Local,
  World,
  Quests,
} from '@/pages';

type PageComponent = Component | null;

const pageRegistry: Record<string, Record<string, Component>> = {
  character: {
    stats: Stats,
    skills: Skills,
    perks: Perks,
    status: Status,
  },
  inventory: {
    weapons: Weapons,
    armor: Armor,
    potions: Potions,
    misc: Misc,
  },
  magic: {
    spells: Spells,
    powers: Powers,
    shouts: Shouts,
  },
  map: {
    local: Local,
    world: World,
    quests: Quests,
  },
};

/**
 * Get page component by tab and subTab
 */
export function usePageRouter(tab: string, subTab: string): PageComponent {
  return pageRegistry[tab]?.[subTab] || null;
}
