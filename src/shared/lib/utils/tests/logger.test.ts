import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/shared/lib/utils/logger';

// =============================================================
// logger tests
// =============================================================

describe('logger.log', () => {
  it('calls console.log in DEV mode', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('test message');
    expect(spy).toHaveBeenCalledWith('test message');
    spy.mockRestore();
  });

  it('passes multiple arguments to console.log', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.log('a', 'b', 42);
    expect(spy).toHaveBeenCalledWith('a', 'b', 42);
    spy.mockRestore();
  });

  it('handles zero arguments', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.log();
    expect(spy).toHaveBeenCalledWith();
    spy.mockRestore();
  });
});