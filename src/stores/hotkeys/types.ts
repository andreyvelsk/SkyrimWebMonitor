import type { HotkeySlot } from '@/api/websocket';
import type { CategoryType, WeaponType, BodySlot } from '@/stores/inventory/types';
import type { MagicSchool } from '@/stores/magic/types';

export type HotkeyKind = 'spell' | 'item';

export type SpellKind = 'Spell' | 'Power' | 'LesserPower' | 'VoicePower' | 'Shout';

export interface HotkeySlotUnbound {
  slot: HotkeySlot;
  bound: false;
}

export interface HotkeySlotSpell {
  slot: HotkeySlot;
  bound: true;
  kind: 'spell';
  name: string;
  formId: string;
  spellType: SpellKind;
  school: MagicSchool | 'None';
  cost: number;
  level: number;
  chargeTime: number;
}

export interface HotkeySlotItem {
  slot: HotkeySlot;
  bound: true;
  kind: 'item';
  name: string;
  formId: string;
  categoryType: CategoryType | 'Unknown';
  count: number;
  weight: number;
  value: number;
  isFavorite: boolean;
  // Optional type hints so the hotkey UI can show a more specific icon
  // (reusing the same mappings as WeaponIcon / ApparelIcon).
  weaponType?: WeaponType;
  bodySlot?: BodySlot | null;
}

export type HotkeySlotEntry = HotkeySlotUnbound | HotkeySlotSpell | HotkeySlotItem;

export interface HotkeyItemsState {
  items?: HotkeySlotEntry[] | null;
}
