import { describe, it, expect } from 'vitest';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';

// =============================================================
// getDescriptionValues tests
// =============================================================

describe('getRoundValue', () => {
  it('returns rounded value to tenths for positive number', () => {
    expect(getRoundValue(42)).toBe(42);
  });

  it('returns rounded value to tenths for float', () => {
    expect(getRoundValue(3.7)).toBe(3.7);
    expect(getRoundValue(3.2)).toBe(3.2);
    expect(getRoundValue(3.25)).toBe(3.3);
    expect(getRoundValue(0.25)).toBe(0.3);
  });

  it('returns 0 for null', () => {
    expect(getRoundValue(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(getRoundValue(undefined)).toBe(0);
  });

  it('returns 0 for negative numbers', () => {
    expect(getRoundValue(-5)).toBe(0);
    expect(getRoundValue(-0.5)).toBe(0);
  });

  it('returns 0 for zero', () => {
    expect(getRoundValue(0)).toBe(0);
  });

  it('handles large numbers', () => {
    expect(getRoundValue(99999.9)).toBe(99999.9);
  });
});