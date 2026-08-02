import { describe, it, expect } from 'vitest';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';

// =============================================================
// getDescriptionValues tests
// =============================================================

describe('getRoundValue', () => {
  it('returns rounded integer for positive number', () => {
    expect(getRoundValue(42)).toBe(42);
  });

  it('returns rounded integer for float', () => {
    expect(getRoundValue(3.7)).toBe(4);
    expect(getRoundValue(3.2)).toBe(3);
  });

  it('returns dash for null', () => {
    expect(getRoundValue(null)).toBe('-');
  });

  it('returns dash for undefined', () => {
    expect(getRoundValue(undefined)).toBe('-');
  });

  it('returns 0 for negative numbers', () => {
    expect(getRoundValue(-5)).toBe(0);
    expect(getRoundValue(-0.5)).toBe(0);
  });

  it('returns - for zero', () => {
    expect(getRoundValue(0)).toBe('-');
  });

  it('handles large numbers', () => {
    expect(getRoundValue(99999.9)).toBe(100000);
  });
});