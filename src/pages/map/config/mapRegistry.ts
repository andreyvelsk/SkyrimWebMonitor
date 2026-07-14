import type { MapConfig, MapRegistry } from './types';
import tamrielProjection from '../data/projections/tamriel.json';
import type { ProjectionData } from './types';

// =============================================================
// Per-map image correction matrices
// =============================================================

/**
 * Affine correction for the Tamriel hand-painted map texture.
 * Compensates for slight artistic distortion between the FWMF mesh UVs
 * and the actual pixel positions on the painted map.
 */
const TAMRIEL_IMAGE_CORRECTION = {
  a: 1.0009632654426412,
  c: 0.0024280042349955015,
  e: -7.934611523904017,
  b: -0.001708694270502052,
  d: 1.010553408600275,
  f: -37.5297259438135,
};

// =============================================================
// Map configurations
// =============================================================

const tamrielConfig: MapConfig = {
  worldspace: 'Tamriel',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/tamriel.dzi`,
  projectionData: tamrielProjection as ProjectionData,
  imageCorrection: TAMRIEL_IMAGE_CORRECTION,
  cropX: 500,
  cropYTop: 1500,
  cropYBottom: 2000,
};

// =============================================================
// Registry
// =============================================================

export const mapRegistry: MapRegistry = {
  Tamriel: tamrielConfig,
  // Future maps:
  // DLC2SolstheimWorld: { ... },
};

/** Fallback worldspace when the player's worldspace is unknown or null. */
export const DEFAULT_MAP_WORLDSPACE = 'Tamriel';

/**
 * Resolve a worldspace string to its MapConfig.
 * Returns the Tamriel config as a safe default when the worldspace is
 * not recognised or is null/undefined.
 */
export function getMapConfig(worldspace: string | null | undefined): MapConfig {
  if (worldspace && mapRegistry[worldspace]) {
    return mapRegistry[worldspace];
  }
  return mapRegistry[DEFAULT_MAP_WORLDSPACE];
}