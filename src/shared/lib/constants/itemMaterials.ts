/**
 * Item material → display colour, derived from the item's keyword editor IDs
 * (WeapMaterial*, ArmorMaterial*, DLC1/DLC2 variants, jewelry, clothing).
 *
 * The colour tints the category icon and, for untextured 3D thumbnails, the
 * model itself. Matching is by substring so DLC and most mod keywords that
 * follow the vanilla naming (e.g. "DLC2ArmorMaterialStalhrimHeavy") resolve
 * without a table entry each.
 */

export interface ItemMaterial {
  id: string;
  /** CSS colour for icons. */
  color: string;
  /** 0..1 RGB for WebGL tinting. */
  rgb: [number, number, number];
}

interface MaterialRule {
  id: string;
  color: string;
  /** Lower-case substrings; any match selects the rule. */
  match: string[];
}

// Order matters: the first matching rule wins, so specific names
// ("elvengilded", "dragonplate") come before generic ones ("elven", "dragon").
const MATERIAL_RULES: MaterialRule[] = [
  { id: 'daedric', color: '#c0443a', match: ['daedric'] },
  { id: 'dragonbone', color: '#e6dcc2', match: ['dragonbone', 'dragonplate'] },
  { id: 'dragonscale', color: '#8fb3b0', match: ['dragonscale'] },
  { id: 'stalhrim', color: '#9ad9f2', match: ['stalhrim'] },
  { id: 'ebony', color: '#6d6a86', match: ['ebony'] },
  { id: 'glass', color: '#8fdc7c', match: ['glass'] },
  { id: 'elvenGilded', color: '#f0c95a', match: ['elvengilded'] },
  { id: 'elven', color: '#d9b35b', match: ['elven'] },
  { id: 'nordic', color: '#aeb8c4', match: ['nordic'] },
  { id: 'dwarven', color: '#d1924a', match: ['dwarven', 'dwemer'] },
  { id: 'orcish', color: '#8b9b5a', match: ['orcish'] },
  { id: 'falmer', color: '#b7a071', match: ['falmer'] },
  { id: 'chitin', color: '#a58f47', match: ['chitin'] },
  { id: 'bonemold', color: '#d4c79f', match: ['bonemold'] },
  { id: 'draugr', color: '#8a9a88', match: ['draugr', 'ancientnord'] },
  { id: 'silver', color: '#e3e9f0', match: ['silver'] },
  { id: 'dawnguard', color: '#9aa7b8', match: ['dawnguard'] },
  { id: 'vampire', color: '#8e3b4a', match: ['vampire'] },
  { id: 'imperial', color: '#c8a262', match: ['imperial', 'penitus'] },
  { id: 'stormcloak', color: '#6f8fb0', match: ['stormcloak'] },
  { id: 'nightingale', color: '#5c6378', match: ['nightingale'] },
  { id: 'darkBrotherhood', color: '#8a3434', match: ['darkbrotherhood'] },
  { id: 'steel', color: '#c3cbd4', match: ['steel'] },
  { id: 'iron', color: '#98a0a8', match: ['iron'] },
  { id: 'wood', color: '#a8743f', match: ['wood'] },
  {
    id: 'leather',
    color: '#b07a45',
    match: ['leather', 'hide', 'fur', 'studded', 'scaled', 'thievesguild', 'forsworn', 'hunter'],
  },
  { id: 'jewelry', color: '#ecc75e', match: ['armorjewelry', 'jewelry'] },
  { id: 'clothing', color: '#c9b894', match: ['armorclothing', 'clothing'] },
];

/** Colour used when no keyword identifies a material. */
export const DEFAULT_ITEM_MATERIAL: ItemMaterial = {
  id: 'default',
  color: 'var(--skyrim-text-accent)',
  rgb: [0.72, 0.7, 0.66],
};

/** Accent for enchanted items (glow around icons and thumbnails). */
export const ENCHANTED_GLOW_COLOR = '#7fb8ff';

const MATERIALS: ItemMaterial[] = MATERIAL_RULES.map((rule) => ({
  id: rule.id,
  color: rule.color,
  rgb: hexToRgb(rule.color),
}));

// Only material/type keywords are interesting; skip vendor and flag keywords.
function isMaterialKeyword(keyword: string): boolean {
  const k = keyword.toLowerCase();
  return (
    k.includes('material') ||
    k.includes('materiel') || // vanilla typo: DLC1ArmorMaterielFalmerHeavyOriginal
    k.startsWith('armorjewelry') ||
    k.startsWith('armorclothing') ||
    k.startsWith('armornightingale') ||
    k.startsWith('armordarkbrotherhood')
  );
}

export function getItemMaterial(keywords?: readonly string[] | null): ItemMaterial {
  if (!keywords || keywords.length === 0) return DEFAULT_ITEM_MATERIAL;
  const relevant = keywords.filter(isMaterialKeyword).map((k) => k.toLowerCase());
  if (relevant.length === 0) return DEFAULT_ITEM_MATERIAL;

  for (let i = 0; i < MATERIAL_RULES.length; i++) {
    const rule = MATERIAL_RULES[i];
    if (relevant.some((k) => rule.match.some((m) => k.includes(m)))) return MATERIALS[i];
  }
  return DEFAULT_ITEM_MATERIAL;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [((value >> 16) & 0xff) / 255, ((value >> 8) & 0xff) / 255, (value & 0xff) / 255];
}
