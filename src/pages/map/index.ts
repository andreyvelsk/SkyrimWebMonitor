export { default as TheMap } from './TheMap.vue';
export { preloadMapImage, MAP_IMAGE_URL } from './preloadMap';
export {
  useMapCoordinates,
  solveAffine,
  solveAffineLeastSquares,
  REFERENCE_POINTS,
  WHITERUN_GAME,
  SOLITUDE_GAME,
  RIFTEN_GAME,
  WHITERUN_IMAGE_PX,
  SOLITUDE_IMAGE_PX,
  RIFTEN_IMAGE_PX,
} from './composables/useMapCoordinates';
export type {
  Point,
  AffineMatrix,
  ReferencePoint,
  UseMapCoordinates,
} from './composables/useMapCoordinates';
export {
  DEFAULT_MARKER_ICON,
  MARKER_ICON_MAP,
  resolveMarkerIcon,
} from './composables/useMapMarkerIcons';
