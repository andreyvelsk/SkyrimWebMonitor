/**
 * Dev-only logger.
 *
 * Use `logger.log(...)` instead of `console.log(...)`.
 * In production builds, calls are tree-shaken out of the bundle (via `import.meta.env.DEV`).
 *
 * @example
 * ```ts
 * import { logger } from '@/shared/lib/utils/logger';
 * logger.log('Player position:', x, y);
 * ```
 */
export const logger = {
  log(...args: unknown[]): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
};