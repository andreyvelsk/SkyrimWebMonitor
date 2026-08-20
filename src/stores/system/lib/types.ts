export const FEATURES = {
  PLAYER: 'player',
  PLAYER_HOTKEYS: 'player.hotkeys',
  PLAYER_QUESTS: 'player.quests',
  INVENTORY: 'inventory',
  MAGIC: 'magic',
  MAP: 'map',
  FILE_DOWNLOAD: 'file_download',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
export type Features = Feature[];