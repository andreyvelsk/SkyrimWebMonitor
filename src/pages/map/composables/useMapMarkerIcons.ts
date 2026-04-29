import type { MapHotspotType } from '@/stores/map/types';

// =============================================================
// Map marker icons
// =============================================================
//
// Maps a hotspot `type` (string from the game) to an SVG icon URL. Add new
// entries here as the icon set grows. Anything not present in the map falls
// back to {@link DEFAULT_MARKER_ICON}.
//
// Icon URLs are built relative to Vite's BASE_URL so they work under any
// deploy base path. Files under /public/markers/ live OUTSIDE /public/icons/
// on purpose — the build's icon-prune step is scoped to /icons/, so markers
// are never affected by it.
// =============================================================

const BASE = import.meta.env.BASE_URL;

/** Default icon used when a hotspot type has no explicit mapping. */
export const DEFAULT_MARKER_ICON = `${BASE}markers/position-marker.svg`;

/**
 * Mapping from hotspot type → icon URL. Extend freely; values are plain
 * strings, so any path under /public is acceptable.
 */
export const MARKER_ICON_MAP: Partial<Record<MapHotspotType, string>> = {
  // WhiterunCapitol: `${BASE}markers/whiterun.svg`,
  // SolitudeCapitol: `${BASE}markers/solitude.svg`,
  // RiftenCapitol: `${BASE}markers/riften.svg`,
  // NordicTower: `${BASE}markers/nordic-tower.svg`,
  // NordicRuin: `${BASE}markers/nordic-ruin.svg`,
};

/**
 * Resolve the icon URL for a given hotspot type. Falls back to the default
 * marker if no mapping exists.
 */
export function resolveMarkerIcon(type: MapHotspotType): string {
  return MARKER_ICON_MAP[type] ?? DEFAULT_MARKER_ICON;
}
