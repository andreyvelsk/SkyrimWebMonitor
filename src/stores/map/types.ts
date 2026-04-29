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
