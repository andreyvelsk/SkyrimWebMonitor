export { default as TheMap } from './the-map/TheMap.vue';
export {
  prefetchMapTiles,
  mapTileBlobUrls,
  mapTilesPrefetchActive,
  mapTilesPrefetchProgress,
} from './preloadMap';
export {
  createMapProjection,
  useMapProjection,
} from './composables/useMapProjection';
export type {
  MapProjectionFn,
  ProjectedPoint,
  UseMapProjection,
} from './lib/types';
export {
  DEFAULT_MARKER_ICON,
  resolveMarkerIcon,
} from './composables/useMapMarkerIcons';
export { getMapConfig, mapRegistry, DEFAULT_MAP_WORLDSPACE } from './config/mapRegistry';
export type { MapConfig, MapRegistry, ProjectionData, ImageCorrectionMatrix } from './config/lib/types';
