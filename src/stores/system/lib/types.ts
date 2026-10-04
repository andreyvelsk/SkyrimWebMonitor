export const FEATURES = {
  PLAYER: 'player',
  PLAYER_HOTKEYS: 'player.hotkeys',
  PLAYER_QUESTS: 'player.quests',
  INVENTORY: 'inventory',
  MAGIC: 'magic',
  MAP: 'map',
  FILE_DOWNLOAD: 'file_download',
  TEXTURE_PREVIEW: 'texture_preview',
  TEXTURE_PREVIEW_MAX_SIZE: 'texture_preview.maxSize',
  INVENTORY_MODELS: 'inventory.models',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];
export type Features = Feature[];