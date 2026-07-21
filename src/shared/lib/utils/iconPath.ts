/**
 * Get the base path for icons based on Vite config
 * Uses import.meta.env.BASE_URL which comes from vite.config.js (base: '/SkyrimWebMonitor/')
 */
declare const __USED_ICON_DATA_URLS__: Record<string, string>;

const EMBEDDED_ICON_URLS = __USED_ICON_DATA_URLS__;

export function getIconBasePath(): string {
  return `${import.meta.env.BASE_URL}icons`;
}

/**
 * Build the full path to an icon
 * @param iconPath - relative icon path (e.g. 'lorc/piercing-sword.svg')
 */
export function buildIconPath(iconPath: string): string {
  const embeddedIconUrl = EMBEDDED_ICON_URLS[iconPath];
  if (embeddedIconUrl) {
    return embeddedIconUrl;
  }

  return `${getIconBasePath()}/${iconPath}`;
}
