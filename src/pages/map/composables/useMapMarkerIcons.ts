import type { MapHotspotType } from '@/stores/map/types';
import { buildIconPath } from '@/shared/lib/utils/iconPath';

// =============================================================
// Map marker icons
// =============================================================
//
// Maps a hotspot `type` (string from the game) to an SVG icon URL. Add new
// entries here as the icon set grows. Anything not present in the map falls
// back to {@link DEFAULT_MARKER_ICON}.
//
// Icon URLs are built via {@link buildIconPath} so they resolve relative to
// Vite's BASE_URL and work under any deploy base path.
// =============================================================

/** Default icon used when a hotspot type has no explicit mapping. */
export const DEFAULT_MARKER_ICON = buildIconPath('delapouite/position-marker.svg');

/**
 * Mapping from hotspot type → icon URL. Extend freely; values are plain
 * strings, so any path under /public/icons is acceptable.
 */
export const MARKER_ICON_MAP: Partial<Record<MapHotspotType, string>> = {
  // WhiterunCapitol: buildIconPath('delapouite/whiterun.svg'),
  // SolitudeCapitol: buildIconPath('delapouite/solitude.svg'),
  // RiftenCapitol: buildIconPath('delapouite/riften.svg'),
  // NordicTower: buildIconPath('delapouite/nordic-tower.svg'),
  // NordicRuin: buildIconPath('delapouite/nordic-ruin.svg'),
};

/**
 * Resolve the icon URL for a given hotspot type. Falls back to the default
 * marker if no mapping exists.
 */
export function resolveMarkerIcon(type: MapHotspotType): string {
  return MARKER_ICON_MAP[type] ?? DEFAULT_MARKER_ICON;
}
