import { buildIconPath } from '@/shared/lib/utils/iconPath';

// Map marker overlay tuning.
export const MARKER_BASE_SIZE_PX = 26;
export const MARKER_ZOOM_INFLUENCE = 0.2;
export const MARKER_MIN_SIZE_PX = 18;
export const MARKER_MAX_SIZE_PX = 72;
export const MARKER_SELECTED_SCALE = 1.35;

// Player marker tuning.
export const PLAYER_BASE_SIZE_PX = 28;
export const PLAYER_ZOOM_INFLUENCE = 0.3;
export const PLAYER_MIN_SIZE_PX = 24;
export const PLAYER_MAX_SIZE_PX = 96;

// Marker icon URLs.
export const PLAYER_ICON_URL = buildIconPath('map/player.svg');
export const QUEST_ICON_URL = buildIconPath('map/quest.svg');

// Math helpers.
export const RAD_TO_DEG = 180 / Math.PI;