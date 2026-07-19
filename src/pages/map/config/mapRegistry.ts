import type { MapConfig, MapRegistry } from './types';
import { tamrielProjection, TAMRIEL_IMAGE_CORRECTION } from '../data/projections/tamriel.ts';
import { vynProjection, VYN_IMAGE_CORRECTION } from '../data/projections/vyn.ts';


// =============================================================
// Map configurations
// =============================================================

const tamrielConfig: MapConfig = {
  worldspace: 'Tamriel',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/tamriel.dzi`,
  projectionData: tamrielProjection,
  imageCorrection: TAMRIEL_IMAGE_CORRECTION,
  cropX: 500,
  cropYTop: 1500,
  cropYBottom: 2000,
};

const vynConfig: MapConfig = {
  worldspace: 'Vyn',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/vyn.dzi`,
  projectionData: vynProjection,
  imageCorrection: VYN_IMAGE_CORRECTION,
  cropX: 0,
  cropYTop: 0,
  cropYBottom: 0,
};

// =============================================================
// Registry
// =============================================================

export const mapRegistry: MapRegistry = {
  Tamriel: tamrielConfig,
  Vyn: vynConfig,
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