export { default as TheMap } from './TheMap.vue';
export {
  preloadMapImage,
  prefetchMapTiles,
  mapTileBlobUrls,
  mapTilesPrefetchActive,
  mapTilesPrefetchProgress,
  MAP_IMAGE_URL,
  MAP_DZI_URL,
} from './preloadMap';
export {
  FWMF_MAP_BOUNDS,
  FWMF_MAP_IMAGE_HEIGHT,
  FWMF_MAP_IMAGE_WIDTH,
  FWMF_MAP_MESH_NAME,
  projectWorldToImage,
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
