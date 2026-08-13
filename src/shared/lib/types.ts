import type { Component } from 'vue';
import type { InventoryItem } from '@/stores/inventory/lib/types';
import type { SpellItem, ShoutItem } from '@/stores/magic/lib/types';
import type { QuestListEntry } from '@/stores/quests/lib/types';

// =============================================================
// Theme gamut types
// =============================================================

export interface ThemeGamut {
  /** Unique id; also used as the `data-theme-gamut` attribute value. */
  id: string;
  /** i18n key for the gamut name shown in the settings UI. */
  labelKey: string;
}

// =============================================================
// Common / shared types (formerly types/common.ts)
// =============================================================

export type EquipSlot = 'right' | 'left';

export type EquippedHand = 'right' | 'left' | 'both' | null;

export interface ItemEnchantmentEffect {
  description: string;
  descriptionTemplate: string;
  duration: number;
  magnitude: number;
  name: string;
}

export interface ItemEnchantment {
  effects: ItemEnchantmentEffect[];
  name: string;
}

// =============================================================
// Category / list types (formerly types/types.ts)
// =============================================================

export interface CategoryItem {
  categoryId: string;
  count: number;
  name: string;
}

export interface CategoriesData {
  categories: CategoryItem[];
}

export type ListItem = InventoryItem | SpellItem | ShoutItem | QuestListEntry;

// =============================================================
// Modal types (formerly in composables/useModal.ts)
// =============================================================

export interface ModalOptions {
  component: Component;
  /** props of child component */
  props?: Record<string, unknown>;
  /** event handlers of child component */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on?: Record<string, (...args: any[]) => unknown>;
  /** callback when modal is closed */
  onClose?: () => void;
  /**
   * Ignore click events for a short time after opening.
   * Helps block delayed synthesized "ghost click" on mobile WebViews.
   */
  ghostClickGuardMs?: number;
}