export { default as TheMap } from './TheMap.vue';
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
} from './composables/useMapProjection';
export {
  DEFAULT_MARKER_ICON,
  MARKER_ICON_MAP,
  resolveMarkerIcon,
} from './composables/useMapMarkerIcons';
export { getMapConfig, mapRegistry, DEFAULT_MAP_WORLDSPACE } from './config/mapRegistry';
export type { MapConfig, MapRegistry, ProjectionData, ImageCorrectionMatrix } from './config/types';
