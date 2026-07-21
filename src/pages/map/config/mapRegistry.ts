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

const vynCommon = {
  worldspace: 'Vyn',
  projectionData: vynProjection,
  imageCorrection: VYN_IMAGE_CORRECTION,
  cropX: 0,
  cropYTop: 0,
  cropYBottom: 0,
};

const vynConfig: MapConfig = {
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/vyn.dzi`,
  ...vynCommon,
};

const vynRUConfig: MapConfig = {
  language: 'RU',
  dziUrl: `${import.meta.env.BASE_URL}map-dzi/vyn_ru.dzi`,
  ...vynCommon,
};

// =============================================================
// Registry
// =============================================================

export const mapRegistry: MapRegistry = {
  Tamriel: [tamrielConfig],
  Vyn: [vynConfig, vynRUConfig],
};

/** Fallback worldspace when the player's worldspace is unknown or null. */
export const DEFAULT_MAP_WORLDSPACE = 'Tamriel';

/**
 * Pick the best config from a list: prefer one whose `language` matches
 * `locale`, falling back to the first config without a `language` (the
 * default), and finally to the first entry in the list.
 */
function findBestConfig(configs: MapConfig[], locale?: string): MapConfig {
  if (locale) {
    const upperLocale = locale.toUpperCase();
    const langMatch = configs.find((c) => c.language?.toUpperCase() === upperLocale);
    if (langMatch) return langMatch;
  }
  return configs.find((c) => !c.language) ?? configs[0];
}

/**
 * Resolve a worldspace string to its MapConfig.
 *
 * When `locale` is provided (e.g. `'ru'` / `'en'` from i18n), configs
 * whose `language` field matches the locale take priority. Otherwise the
 * first language-less ("default") config is returned.
 *
 * Falls back to the Tamriel default when the worldspace is not recognised
 * or is null/undefined.
 */
export function getMapConfig(
  worldspace: string | null | undefined,
  locale?: string,
): MapConfig {
  if (worldspace && mapRegistry[worldspace]) {
    return findBestConfig(mapRegistry[worldspace], locale);
  }
  return findBestConfig(mapRegistry[DEFAULT_MAP_WORLDSPACE], locale);
}