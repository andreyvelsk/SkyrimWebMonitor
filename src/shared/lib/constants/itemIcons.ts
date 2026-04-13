// Apparel type icons mapping
export const APPAREL_TYPE_ICONS: Record<string, string> = {
  Head: 'helm',      // Шлемы
  Hair: 'skull',       // Причёски/маски
  Body: 'dress',       // Нагрудники/платья
  Hands: 'gloves',     // Перчатки
  Feet: 'boot',        // Сапоги
  Outfit: 'coat',      // Комбинезоны/плащи
  Jewelry: 'gem',      // Украшения
};

export function getApparelIcon(apparelType: string | null): string {
  if (!apparelType) return 'dress';
  return APPAREL_TYPE_ICONS[apparelType] || 'dress';
}

// Magic school icons
export const MAGIC_SCHOOL_ICONS: Record<string, string> = {
  Alteration: 'wand',
  Conjuration: 'crown',
  Destruction: 'flame',
  Illusion: 'eye',
  Restoration: 'cross',
  Mysticism: 'sparkles',
};

export function getMagicSchoolIcon(schoolType: string | null): string {
  if (!schoolType) return 'wand';
  return MAGIC_SCHOOL_ICONS[schoolType] || 'wand';
}

// Item rarity colors
export const RARITY_COLORS: Record<string, string> = {
  common: 'var(--skyrim-text-primary)',
  uncommon: '#1eff00',   // Green
  rare: '#0070dd',       // Blue
  epic: '#a335ee',       // Purple
  legendary: '#ff8000',  // Orange
};

export function getRarityColor(rarity: string | null): string {
  if (!rarity) return RARITY_COLORS.common;
  return RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common;
}
