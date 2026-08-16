/**
 * Hotspot type identifier sent by the game server in the `type` field.
 *
 * The set is open: any string is allowed, but the values listed here mirror
 * the game's `Map::Hotspot` marker types and are derived from the keys of
 * {@link MAP_HOTSPOT_ID_BY_TYPE}. The numeric `typeId` is the authoritative
 * id; {@link getMapHotspotType} resolves it to this union.
 *
 * To add a new type, append it to {@link MAP_HOTSPOT_ID_BY_TYPE} and to
 * {@link MAP_HOTSPOT_TYPE_BY_ID} so it appears in intellisense and resolves
 * from its `typeId`, then map it to an icon in
 * `src/pages/map/composables/useMapMarkerIcons.ts`.
 */
export type KnownMapHotspotType = keyof typeof MAP_HOTSPOT_ID_BY_TYPE;

export type MapHotspotType = KnownMapHotspotType | (string & {});

/**
 * Authoritative `typeId` → `type` correspondence from the game's
 * `Map::Hotspot` marker table.
 *
 * typeIds 60 (`kTotalLocationTypes`) and 63 (reserved) both report `Unknown`;
 * any id missing from this map also falls back to `Unknown` via
 * {@link getMapHotspotType}.
 */
export const MAP_HOTSPOT_TYPE_BY_ID: Readonly<Record<number, KnownMapHotspotType>> = {
  0: 'None',
  1: 'City',
  2: 'Town',
  3: 'Settlement',
  4: 'Cave',
  5: 'Camp',
  6: 'Fort',
  7: 'NordicRuin',
  8: 'DwemerRuin',
  9: 'Shipwreck',
  10: 'Grove',
  11: 'Landmark',
  12: 'DragonLair',
  13: 'Farm',
  14: 'WoodMill',
  15: 'Mine',
  16: 'ImperialCamp',
  17: 'StormcloakCamp',
  18: 'Doomstone',
  19: 'WheatMill',
  20: 'Smelter',
  21: 'Stable',
  22: 'ImperialTower',
  23: 'Clearing',
  24: 'Pass',
  25: 'Altar',
  26: 'Rock',
  27: 'Lighthouse',
  28: 'OrcStronghold',
  29: 'GiantCamp',
  30: 'Shack',
  31: 'NordicTower',
  32: 'NordicDwelling',
  33: 'Docks',
  34: 'Shrine',
  35: 'RiftenCastle',
  36: 'RiftenCapitol',
  37: 'WindhelmCastle',
  38: 'WindhelmCapitol',
  39: 'WhiterunCastle',
  40: 'WhiterunCapitol',
  41: 'SolitudeCastle',
  42: 'SolitudeCapitol',
  43: 'MarkarthCastle',
  44: 'MarkarthCapitol',
  45: 'WinterholdCastle',
  46: 'WinterholdCapitol',
  47: 'MorthalCastle',
  48: 'MorthalCapitol',
  49: 'FalkreathCastle',
  50: 'FalkreathCapitol',
  51: 'DawnstarCastle',
  52: 'DawnstarCapitol',
  53: 'DLC02MiraakTemple',
  54: 'DLC02RavenRock',
  55: 'DLC02BeastStone',
  56: 'DLC02TelMithryn',
  57: 'DLC02ToSkyrim',
  58: 'DLC02StalhrimSource',
  59: 'DLC02CastleKarstaag',
  60: 'Unknown',
  61: 'Door',
  62: 'QuestTarget',
  63: 'Unknown',
  64: 'PlayerSet',
  65: 'YouAreHere',
};

/**
 * `type` → `typeId` lookup; its keys define {@link KnownMapHotspotType}.
 * `Unknown` is ambiguous (typeIds 60 and 63), so it resolves to the sentinel
 * id 60; use {@link MAP_HOTSPOT_TYPE_BY_ID} for the authoritative id → type
 * direction.
 */
export const MAP_HOTSPOT_ID_BY_TYPE = {
  None: 0,
  City: 1,
  Town: 2,
  Settlement: 3,
  Cave: 4,
  Camp: 5,
  Fort: 6,
  NordicRuin: 7,
  DwemerRuin: 8,
  Shipwreck: 9,
  Grove: 10,
  Landmark: 11,
  DragonLair: 12,
  Farm: 13,
  WoodMill: 14,
  Mine: 15,
  ImperialCamp: 16,
  StormcloakCamp: 17,
  Doomstone: 18,
  WheatMill: 19,
  Smelter: 20,
  Stable: 21,
  ImperialTower: 22,
  Clearing: 23,
  Pass: 24,
  Altar: 25,
  Rock: 26,
  Lighthouse: 27,
  OrcStronghold: 28,
  GiantCamp: 29,
  Shack: 30,
  NordicTower: 31,
  NordicDwelling: 32,
  Docks: 33,
  Shrine: 34,
  RiftenCastle: 35,
  RiftenCapitol: 36,
  WindhelmCastle: 37,
  WindhelmCapitol: 38,
  WhiterunCastle: 39,
  WhiterunCapitol: 40,
  SolitudeCastle: 41,
  SolitudeCapitol: 42,
  MarkarthCastle: 43,
  MarkarthCapitol: 44,
  WinterholdCastle: 45,
  WinterholdCapitol: 46,
  MorthalCastle: 47,
  MorthalCapitol: 48,
  FalkreathCastle: 49,
  FalkreathCapitol: 50,
  DawnstarCastle: 51,
  DawnstarCapitol: 52,
  DLC02MiraakTemple: 53,
  DLC02RavenRock: 54,
  DLC02BeastStone: 55,
  DLC02TelMithryn: 56,
  DLC02ToSkyrim: 57,
  DLC02StalhrimSource: 58,
  DLC02CastleKarstaag: 59,
  Unknown: 60,
  Door: 61,
  QuestTarget: 62,
  PlayerSet: 64,
  YouAreHere: 65,
} as const;

/**
 * Type guard: whether a string is a known {@link KnownMapHotspotType}.
 */
export function isKnownMapHotspotType(value: string): value is KnownMapHotspotType {
  return value in MAP_HOTSPOT_ID_BY_TYPE;
}

/**
 * Resolve a numeric `typeId` to its hotspot `type` string. Unknown or unmapped
 * ids fall back to `'Unknown'`.
 */
export function getMapHotspotType(typeId: number): KnownMapHotspotType {
  return MAP_HOTSPOT_TYPE_BY_ID[typeId] ?? 'Unknown';
}

/**
 * Resolve a hotspot `type` string to its primary numeric `typeId`. Returns
 * `null` when the type is not a known {@link KnownMapHotspotType}.
 */
export function getMapHotspotTypeId(type: MapHotspotType): number | null {
  if (!isKnownMapHotspotType(type)) return null;
  return MAP_HOTSPOT_ID_BY_TYPE[type];
}

/**
 * Single hotspot as delivered by the game server. `x` / `y` are in raw game
 * coordinates — exactly the values the FWMF map projection expects.
 */
export interface MapHotspot {
  type: MapHotspotType;
  typeId: number;
  refId: string;
  name: string;
  x: number;
  y: number;
  isVisible: boolean;
  canFastTravel: boolean;
}

/**
 * Shape of the WebSocket payload — one field, `hot`, holding the array.
 * Mirrors what the server sends (`{ fields: { hot: [...] } }` is unwrapped
 * by the data router before reaching the store).
 */
export interface MapHotspotsState {
  hot: MapHotspot[];
}

/**
 * Quest objective marker from the game server. Coordinates are in the same
 * raw game space as regular hotspots and can be projected with the same map
 * projection when the marker belongs to top-level Tamriel.
 */
export interface MapQuestMarker {
  aliasId: number;
  cell: string | null;
  cellFormId: string | null;
  isInterior: boolean;
  name: string;
  objectiveIndex: number;
  objectiveText: string;
  objectiveTextResolved: string;
  parentWorldspace: string | null;
  parentWorldspaceFormId: string | null;
  questEditorId: string;
  questFormId: string;
  questName: string;
  questType: string;
  refId: string;
  worldspace: string | null;
  worldspaceFormId: string | null;
  x: number;
  y: number;
  z: number;
}

/** `Map::Markers::Quests` payload shape (after field unwrapping). */
export interface MapQuestMarkersState {
  marker: MapQuestMarker[];
}

/**
 * `Player::Position` payload from the game server. Updated at high frequency
 * (multiple times per second) — keep handlers cheap.
 *
 * Coordinate system note: every Skyrim worldspace has its own local `(x, y)`.
 * Only when `worldspace === "Tamriel"` (and `isInterior === false`) can the
 * coordinates be plotted directly on the global Tamriel map. For interiors
 * and Tamriel city sub-worlds (`WhiterunWorld`, `RiftenWorld`, …), use
 * {@link ExteriorPosition} to pin the marker at the entrance.
 *
 * Field reference (see SkyrimWebSocket / docs/Player.md):
 * - `x`, `y`, `z` — coordinates local to the current worldspace / cell.
 * - `angle` — Z-axis rotation (yaw) in **radians**. `0` = North, increases
 *   **clockwise**. SVG's `rotate()` is clockwise-positive too, so converting
 *   radians → degrees with no axis flip is enough.
 * - `worldspace` / `worldspaceFormId` — current worldspace EditorID and hex
 *   form ID; both `null` when in an interior.
 * - `parentWorldspace` / `parentWorldspaceFormId` — root of the parentWorld
 *   chain. `"Tamriel"` for Tamriel and any of its city sub-worlds; equals
 *   `worldspace` for top-level worlds (Tamriel, DLC2SolstheimWorld); `null`
 *   in interiors.
 * - `cell` / `cellFormId` — current cell EditorID / form ID.
 * - `isInterior` — `true` if the player is inside a building, dungeon, etc.
 */
export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  angle: number;
  cell: string | null;
  cellFormId: string | null;
  isInterior: boolean;
  worldspace: string | null;
  worldspaceFormId: string | null;
  parentWorldspace: string | null;
  parentWorldspaceFormId: string | null;
}

/**
 * `Player::ExteriorPosition` payload — the last known exterior position the
 * game itself caches for the compass and world map. Used to keep the player
 * marker pinned to the city / dungeon entrance on the global Tamriel map
 * while the player is inside an interior or a Tamriel city sub-world.
 *
 * Has no `angle` / `cell` / `isInterior` fields: it is a static "last seen
 * outside" snapshot in some worldspace's coordinate system. Only safe to
 * plot on the global map when `parentWorldspace === "Tamriel"`.
 */
export interface ExteriorPosition {
  x: number;
  y: number;
  z: number;
  worldspace: string | null;
  worldspaceFormId: string | null;
  parentWorldspace: string | null;
  parentWorldspaceFormId: string | null;
}
