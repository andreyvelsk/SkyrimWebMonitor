/**
 * Dev-only logger.
 *
 * Используйте `logger.log(...)` вместо `console.log(...)`.
 * В production-сборке вызовы не попадут в бандл (tree-shaking через `import.meta.env.DEV`).
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