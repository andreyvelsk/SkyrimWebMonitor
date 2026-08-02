import { describe, it, expect } from 'vitest';
import { buildIconPath, getIconBasePath } from '@/shared/lib/utils/iconPath';

// =============================================================
// iconPath tests
// =============================================================

describe('getIconBasePath', () => {
  it('returns a string ending with icons', () => {
    const result = getIconBasePath();
    expect(typeof result).toBe('string');
    expect(result).toContain('icons');
  });
});

describe('buildIconPath', () => {
  it('builds path for a simple icon', () => {
    const result = buildIconPath('lorc/sword.svg');
    expect(typeof result).toBe('string');
    expect(result).toContain('lorc/sword.svg');
  });

  it('builds path for nested icon', () => {
    const result = buildIconPath('delapouite/gauntlet.svg');
    expect(typeof result).toBe('string');
    expect(result).toContain('delapouite/gauntlet.svg');
  });

  it('returns a non-empty string', () => {
    const result = buildIconPath('test.svg');
    expect(result.length).toBeGreaterThan(0);
  });
});