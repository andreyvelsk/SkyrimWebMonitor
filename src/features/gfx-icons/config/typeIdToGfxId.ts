import {
  getMapHotspotType,
  type KnownMapHotspotType,
} from '@/stores/map/lib/types';

/**
 * Mapping from a hotspot `type` to GFX shape ids.
 *
 * Each entry maps a single type to two shape ids:
 * - `known` — icon for discovered locations (canFastTravel: true).
 * - `undiscovered` — icon for undiscovered locations (canFastTravel: false).
 *
 * Keys are the game's `Map::Hotspot` type strings (see
 * `MAP_HOTSPOT_ID_BY_TYPE`). Extend this map as new type → shapeId
 * correspondences are identified.
 */

export interface GfxShapeIdByFastTravel {
  /** Shape id for discovered locations (canFastTravel: true). */
  known: number;
  /** Shape id for undiscovered locations (canFastTravel: false). */
  undiscovered: number;
}

export type TypeToGfxShapeIdMap = Readonly<
  Partial<Record<KnownMapHotspotType, GfxShapeIdByFastTravel>>
>;

export const GFX_SHAPE_ID_BY_TYPE: TypeToGfxShapeIdMap = {
  City: { known: 271, undiscovered: 264 },
  Town: { known: 273, undiscovered: 262 },
  Settlement: { known: 275, undiscovered: 260 },
  Cave: { known: 277, undiscovered: 258 },
  Camp: { known: 279, undiscovered: 256 },
  Fort: { known: 281, undiscovered: 254 },
  NordicRuin: { known: 283, undiscovered: 252 },
  DwemerRuin: { known: 285, undiscovered: 250 },
  Shipwreck: { known: 287, undiscovered: 248 },
  Grove: { known: 289, undiscovered: 246 },
  Landmark: { known: 291, undiscovered: 244 },
  DragonLair: { known: 293, undiscovered: 242 },
  Farm: { known: 295, undiscovered: 240 },
  WoodMill: { known: 297, undiscovered: 238 },
  Mine: { known: 299, undiscovered: 236 },
  ImperialCamp: { known: 301, undiscovered: 234 },
  StormcloakCamp: { known: 303, undiscovered: 232 },
  Doomstone: { known: 305, undiscovered: 230 },
  WheatMill: { known: 307, undiscovered: 228 },
  Smelter: { known: 309, undiscovered: 226 },
  Stable: { known: 311, undiscovered: 224 },
  ImperialTower: { known: 313, undiscovered: 222 },
  Clearing: { known: 315, undiscovered: 220 },
  Pass: { known: 317, undiscovered: 218 },
  Altar: { known: 319, undiscovered: 216 },
  Rock: { known: 321, undiscovered: 214 },
  Lighthouse: { known: 323, undiscovered: 212 },
  OrcStronghold: { known: 325, undiscovered: 210 },
  GiantCamp: { known: 327, undiscovered: 208 },
  Shack: { known: 329, undiscovered: 206 },
  NordicTower: { known: 331, undiscovered: 204 },
  NordicDwelling: { known: 333, undiscovered: 202 },
  Docks: { known: 335, undiscovered: 200 },
  Shrine: { known: 337, undiscovered: 198 },
  RiftenCastle: { known: 339, undiscovered: 196 },
  RiftenCapitol: { known: 341, undiscovered: 194 },
  WindhelmCastle: { known: 343, undiscovered: 192 },
  WindhelmCapitol: { known: 345, undiscovered: 190 },
  WhiterunCastle: { known: 347, undiscovered: 188 },
  WhiterunCapitol: { known: 349, undiscovered: 186 },
  SolitudeCastle: { known: 351, undiscovered: 184 },
  SolitudeCapitol: { known: 353, undiscovered: 182 },
  MarkarthCastle: { known: 355, undiscovered: 180 },
  MarkarthCapitol: { known: 357, undiscovered: 178 },
  WinterholdCastle: { known: 359, undiscovered: 176 },
  WinterholdCapitol: { known: 361, undiscovered: 174 },
  MorthalCastle: { known: 363, undiscovered: 166 },
  MorthalCapitol: { known: 365, undiscovered: 171 },
  FalkreathCastle: { known: 363, undiscovered: 166 },
  FalkreathCapitol: { known: 368, undiscovered: 168 },
  DawnstarCastle: { known: 363, undiscovered: 166 },
  DawnstarCapitol: { known: 371, undiscovered: 164 },
  Door: { known: 391, undiscovered: 148 },
  PlayerSet: { known: 266, undiscovered: 267 },

  // DLC: Dragonborn — known
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
  // DLC02StalhrimSource
  // 58: { known: null, undiscovered: null },
  // DLC02CastleKarstaag
  // 59: { known: null, undiscovered: 150 },
};

/**
 * Resolve the GFX shape id for a given typeId and fast-travel state.
 * Returns null when the typeId is not mapped.
 */
export function getGfxShapeId(typeId: number, canFastTravel: boolean): number | null {
  const entry = GFX_SHAPE_ID_BY_TYPE[getMapHotspotType(typeId)];
  if (!entry) return null;
  return canFastTravel ? entry.known : entry.undiscovered;
}
