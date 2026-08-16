import { buildIconPath } from '@/shared/lib/utils/iconPath';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { getGfxShapeId } from '@/features/gfx-icons/config/typeIdToGfxId';

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
//
// GFX icons (from hudmenu.gfx) take priority over the static icon map when
// a typeId → shapeId mapping exists and the shape has been loaded into the
// gfx-icons store.
// =============================================================

/** Default icon used when a hotspot type has no explicit mapping. */
export const DEFAULT_MARKER_ICON = buildIconPath('map/location_known.svg');
export const DEFAULT_UNDISCOVERED_MARKER_ICON = buildIconPath('map/location_undiscovered.svg');

/**
 * Resolve the icon URL for a given hotspot type. Falls back to the default
 * marker if no mapping exists.
 */
export function resolveMarkerIcon(canFastTravel: boolean = true): string {
  return canFastTravel ? DEFAULT_MARKER_ICON : DEFAULT_UNDISCOVERED_MARKER_ICON;
}

/**
 * Resolve a GFX icon (SVG data URL) for the given typeId and fast-travel
 * state. Returns null when the typeId is not mapped or the shape has not
 * been loaded into the gfx-icons store.
 */
export function resolveGfxIconUrl(typeId: number, canFastTravel: boolean): string | null {
  const shapeId = getGfxShapeId(typeId, canFastTravel);
  if (shapeId === null) return null;
  return useGfxIconsStore().resolveIconUrl(shapeId);
}

/**
 * Resolve the marker icon for a location hotspot.
 *
 * Priority:
 * 1. GFX icon by typeId + canFastTravel (if mapped and loaded).
 * 2. Static icon by hotspot type string.
 * 3. Default marker icon.
 */
export function resolveLocationIcon(
  typeId: number,
  canFastTravel: boolean,
): string {
  return resolveGfxIconUrl(typeId, canFastTravel) ?? resolveMarkerIcon(canFastTravel);
}
