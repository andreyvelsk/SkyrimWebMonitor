import { buildIconPath } from '@/shared/lib/utils/iconPath';
import {
  getMapHotspotType,
  type KnownMapHotspotType,
} from '@/stores/map/lib/types';

// Map marker overlay tuning.
export const MARKER_BASE_SIZE_PX = 20;
export const MARKER_ZOOM_INFLUENCE = 0.2;
export const MARKER_MIN_SIZE_PX = 18;
export const MARKER_MAX_SIZE_PX = 72;
export const MARKER_SELECTED_SCALE = 1.35;

// Per-type icon size modifier (multiplier over MARKER_BASE_SIZE_PX).
// Final on-screen size = MARKER_BASE_SIZE_PX * modifier * zoomInfluence,
// clamped to [MARKER_MIN_SIZE_PX, MARKER_MAX_SIZE_PX]. Types missing from
// this map fall back to a modifier of 1 (the base size).
export const MARKER_SIZE_MODIFIER_BY_TYPE: Readonly<
  Partial<Record<KnownMapHotspotType, number>>
> = {
  Cave: 0.7,
  Camp: 0.7,
  Shack: 0.7,
  Settlement: 0.7,
  Mine: 0.7,
  Stable: 0.7,
  WoodMill: 0.7,
  Smelter: 0.7,
  Farm: 0.7,
  GiantCamp: 0.7,
  WhiterunCapitol: 1.3,
  SolitudeCapitol: 1.3,
  MarkarthCapitol: 1.3,
  FalkreathCapitol: 1.3,
  DawnstarCapitol: 1.3,
  WindhelmCapitol: 1.3,
  WinterholdCapitol: 1.3,
  MorthalCapitol: 1.3,
  RiftenCapitol: 1.3,
};

export function getMarkerSizeModifier(typeId: number): number {
  return MARKER_SIZE_MODIFIER_BY_TYPE[getMapHotspotType(typeId)] ?? 1;
}

// Player marker tuning.
export const PLAYER_BASE_SIZE_PX = 28;
export const PLAYER_ZOOM_INFLUENCE = 0.3;
export const PLAYER_MIN_SIZE_PX = 24;
export const PLAYER_MAX_SIZE_PX = 96;

// Marker icon URLs.
export const PLAYER_ICON_URL = buildIconPath('map/player.svg');
export const QUEST_ICON_URL = buildIconPath('map/quest.svg');

// Math helpers.
export const RAD_TO_DEG = 180 / Math.PI;