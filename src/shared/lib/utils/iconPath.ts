/**
 * Получить базовый путь для иконок на основе конфига Vite
 * Использует import.meta.env.BASE_URL, которая берется из vite.config.js (base: '/SkyrimWebMonitor/')
 */
declare const __USED_ICON_DATA_URLS__: Record<string, string>;

const EMBEDDED_ICON_URLS = __USED_ICON_DATA_URLS__;

export function getIconBasePath(): string {
  return `${import.meta.env.BASE_URL}icons`;
}

/**
 * Построить полный путь до иконки
 * @param iconPath - относительный путь иконки (например: 'lorc/piercing-sword.svg')
 */
export function buildIconPath(iconPath: string): string {
  const embeddedIconUrl = EMBEDDED_ICON_URLS[iconPath];
  if (embeddedIconUrl) {
    return embeddedIconUrl;
  }

  return `${getIconBasePath()}/${iconPath}`;
}
