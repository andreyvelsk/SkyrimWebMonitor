/**
 * Hotspot type identifier sent by the game server in the `type` field.
 *
 * The set is open: any string is allowed, but the values listed here are the
 * ones we have already seen and the ones the marker icon map uses for lookup.
 * The numeric `typeId` is currently informational only.
 *
 * To add a new type, append it to {@link KnownMapHotspotType} so it appears in
 * intellisense, then map it to an icon in
 * `src/pages/map/composables/useMapMarkerIcons.ts`.
 */
export type KnownMapHotspotType =
  | 'WhiterunCapitol'
  | 'SolitudeCapitol'
  | 'RiftenCapitol'
  | 'MorthalCapitol'
  | 'WinterholdCapitol'
  | 'MarkarthCapitol'
  | 'WindhelmCapitol'
  | 'FalkreathCapitol'
  | 'DawnstarCapitol'
  | 'NordicTower'
  | 'NordicRuin'
  | 'Cave'
  | 'Camp'
  | 'Fort'
  | 'Mine'
  | 'Farm'
  | 'Shipwreck'
  | 'Lighthouse'
  | 'Shrine'
  | 'StandingStone'
  | 'WordWall'
  | 'DragonLair';

export type MapHotspotType = KnownMapHotspotType | (string & {});

/**
 * Single hotspot as delivered by the game server. `x` / `y` are in raw game
 * coordinates — exactly the values the `useMapCoordinates` overlay matrix
 * expects.
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
 * calibration matrix.
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
