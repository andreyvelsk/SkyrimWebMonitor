/**
 * Mapping from MapHotspot.typeId to GFX shape ids.
 *
 * Each entry maps a single typeId to two shape ids:
 * - `known` — icon for discovered locations (canFastTravel: true).
 * - `undiscovered` — icon for undiscovered locations (canFastTravel: false).
 *
 * Extend this map as new typeId → shapeId correspondences are identified.
 */

export interface GfxShapeIdByFastTravel {
  /** Shape id for discovered locations (canFastTravel: true). */
  known: number;
  /** Shape id for undiscovered locations (canFastTravel: false). */
  undiscovered: number;
}

export type TypeIdToGfxShapeIdMap = Record<number, GfxShapeIdByFastTravel>;

export const TYPE_ID_TO_GFX_SHAPE_ID: TypeIdToGfxShapeIdMap = {
  // City
  1: { known: 271, undiscovered: 264 },
  // Town
  2: { known: 273, undiscovered: 262 },
  // Settlement
  3: { known: 275, undiscovered: 260 },
  // Cave
  4: { known: 277, undiscovered: 258 },
  // Camp
  5: { known: 279, undiscovered: 256 },
  // Fort
  6: { known: 281, undiscovered: 254 },
  // NordicRuin
  7: { known: 283, undiscovered: 252 },
  // DwemerRuin
  8: { known: 285, undiscovered: 250 },
  // Shipwreck
  9: { known: 287, undiscovered: 248 },
  // Grove
  10: { known: 289, undiscovered: 246 },
  // Landmark
  11: { known: 291, undiscovered: 244 },
  // DragonLair
  12: { known: 293, undiscovered: 242 },
  // Farm
  13: { known: 295, undiscovered: 240 },
  // WoodMill
  14: { known: 297, undiscovered: 238 },
  // Mine
  15: { known: 299, undiscovered: 236 },
  // ImperialCamp
  16: { known: 301, undiscovered: 234 },
  // StormcloakCamp
  17: { known: 303, undiscovered: 232 },
  // Doomstone
  18: { known: 305, undiscovered: 230 },
  // WheatMill
  19: { known: 307, undiscovered: 228 },
  // Smelter
  20: { known: 309, undiscovered: 226 },
  // Stable
  21: { known: 311, undiscovered: 224 },
  // ImperialTower
  22: { known: 313, undiscovered: 222 },
  // Clearing
  23: { known: 315, undiscovered: 220 },
  // Pass
  24: { known: 317, undiscovered: 218 },
  // Altar
  25: { known: 319, undiscovered: 216 },
  // Rock
  26: { known: 321, undiscovered: 214 },
  // Lighthouse
  27: { known: 323, undiscovered: 212 },
  // OrcStronghold
  28: { known: 325, undiscovered: 210 },
  // GiantCamp
  29: { known: 327, undiscovered: 208 },
  // Shack
  30: { known: 329, undiscovered: 206 },
  // NordicTower
  31: { known: 331, undiscovered: 204 },
  // NordicDwelling
  32: { known: 333, undiscovered: 202 },
  // Docks
  33: { known: 335, undiscovered: 200 },
  // Shrine
  34: { known: 337, undiscovered: 198 },
  // RiftenCastle
  35: { known: 339, undiscovered: 196 },
  // RiftenCapitol
  36: { known: 341, undiscovered: 194 },
  // WindhelmCastle
  37: { known: 343, undiscovered: 192 },
  // WindhelmCapitol
  38: { known: 345, undiscovered: 190 },
  // WhiterunCastle
  39: { known: 347, undiscovered: 188 },
  // WhiterunCapitol
  40: { known: 349, undiscovered: 186 },
  // SolitudeCastle
  41: { known: 351, undiscovered: 184 },
  // SolitudeCapitol
  42: { known: 353, undiscovered: 182 },
  // MarkarthCastle
  43: { known: 355, undiscovered: 180 },
  // MarkarthCapitol
  44: { known: 357, undiscovered: 178 },
  // WinterholdCastle
  45: { known: 359, undiscovered: 176 },
  // WinterholdCapitol
  46: { known: 361, undiscovered: 174 },
  // MorthalCastle — shares icon with FalkreathCastle and DawnstarCastle
  47: { known: 363, undiscovered: 166 },
  // MorthalCapitol
  48: { known: 365, undiscovered: 171 },
  // FalkreathCastle — shares icon with MorthalCastle and DawnstarCastle
  49: { known: 363, undiscovered: 166 },
  // FalkreathCapitol
  50: { known: 368, undiscovered: 168 },
  // DawnstarCastle — shares icon with MorthalCastle and FalkreathCastle
  51: { known: 363, undiscovered: 166 },
  // DawnstarCapitol
  52: { known: 371, undiscovered: 164 },

  // DLC: Dragonborn — known-иконки отсутствуют в names.json, нужна проверка
  // DLC02MiraakTemple
  // 53: { known: null, undiscovered: 162 },
  // DLC02RavenRock
  // 54: { known: null, undiscovered: 160 },
  // DLC02BeastStone
  // 55: { known: null, undiscovered: 158 },
  // DLC02TelMithryn
  // 56: { known: null, undiscovered: 156 },
  // DLC02ToSkyrim
  // 57: { known: null, undiscovered: 154 },
  // DLC02StalhrimSource — отсутствует в names.json
  // 58: { known: null, undiscovered: null },
  // DLC02CastleKarstaag
  // 59: { known: null, undiscovered: 150 },

  // Door
  61: { known: 391, undiscovered: 148 },

  // QuestTarget — нет точного соответствия в names.json, нужна проверка
  // 62: { known: null, undiscovered: null },

  // PlayerSet
  64: { known: 266, undiscovered: 267 },

  // YouAreHere — отсутствует в names.json
  // 65: { known: null, undiscovered: null },
};

/**
 * Resolve the GFX shape id for a given typeId and fast-travel state.
 * Returns null when the typeId is not mapped.
 */
export function getGfxShapeId(typeId: number, canFastTravel: boolean): number | null {
  const entry = TYPE_ID_TO_GFX_SHAPE_ID[typeId];
  if (!entry) return null;
  return canFastTravel ? entry.known : entry.undiscovered;
}