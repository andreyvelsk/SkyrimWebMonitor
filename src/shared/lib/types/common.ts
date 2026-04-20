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
