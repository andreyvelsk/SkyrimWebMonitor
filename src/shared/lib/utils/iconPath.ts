/**
 * Получить базовый путь для иконок на основе конфига Vite
 * Использует import.meta.env.BASE_URL, которая берется из vite.config.js (base: '/SkyrimWebMonitor/')
 */
export function getIconBasePath(): string {
  return `${import.meta.env.BASE_URL}icons`;
}

/**
 * Построить полный путь до иконки
 * @param iconPath - относительный путь иконки (например: 'lorc/piercing-sword.svg')
 */
export function buildIconPath(iconPath: string): string {
  return `${getIconBasePath()}/${iconPath}`;
}
