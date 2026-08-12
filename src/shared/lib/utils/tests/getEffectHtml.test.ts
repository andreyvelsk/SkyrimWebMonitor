import { describe, it, expect } from 'vitest';
import { getEffectHtml } from '@/shared/lib/utils/getEffectHtml';
import type { ItemEnchantmentEffect } from '@/shared/lib/types';

function makeEffect(overrides: Partial<ItemEnchantmentEffect> = {}): ItemEnchantmentEffect {
  return {
    description: 'Test effect',
    descriptionTemplate: 'Deals <mag> damage for <dur> seconds.',
    duration: 10,
    magnitude: 25,
    name: 'Fire Damage',
    ...overrides,
  };
}

describe('getEffectHtml', () => {
  it('returns empty string for null', () => {
    expect(getEffectHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(getEffectHtml(undefined)).toBe('');
  });

  it('returns empty string for empty array', () => {
    expect(getEffectHtml([])).toBe('');
  });

  it('formats a single effect with <mag> and <dur>', () => {
    const effects = [makeEffect()];
    const result = getEffectHtml(effects);
    expect(result).toContain('<strong>25</strong>');
    expect(result).toContain('<strong>10</strong>');
  });

  it('handles numeric tags like <50>', () => {
    const effects = [makeEffect({ descriptionTemplate: 'Increases by <50> points.' })];
    const result = getEffectHtml(effects);
    expect(result).toContain('<strong>50</strong>');
  });

  it('handles survival mode templates when not in survival mode', () => {
    const effects = [makeEffect({ descriptionTemplate: 'Normal [SURV=Survival text] effect.' })];
    const result = getEffectHtml(effects, false);
    expect(result).not.toContain('Survival text');
    expect(result).toContain('Normal');
  });

  it('handles survival mode templates when in survival mode', () => {
    const effects = [makeEffect({ descriptionTemplate: 'Normal [SURV=Survival text] effect.' })];
    const result = getEffectHtml(effects, true);
    expect(result).toContain('Survival text');
  });

  it('returns empty string when survival-only effect is not in survival mode', () => {
    const effects = [makeEffect({ descriptionTemplate: '[SURV=Survival only]' })];
    const result = getEffectHtml(effects, false);
    expect(result).toBe('');
  });

  it('escapes HTML in effect text', () => {
    const effects = [makeEffect({ descriptionTemplate: '<script>alert("xss")</script>' })];
    const result = getEffectHtml(effects);
    expect(result).not.toContain('<script>');
    expect(result).toContain('lt;script');
  });

  it('escapes ampersands', () => {
    const effects = [makeEffect({ descriptionTemplate: 'Health & Stamina' })];
    const result = getEffectHtml(effects);
    expect(result).toContain('&');
  });

  it('joins multiple effects with space', () => {
    const effects = [
      makeEffect({ descriptionTemplate: 'First effect.' }),
      makeEffect({ descriptionTemplate: 'Second effect.' }),
    ];
    const result = getEffectHtml(effects);
    expect(result).toContain(' ');
  });

  it('returns empty string for effect without descriptionTemplate', () => {
    const effects = [makeEffect({ descriptionTemplate: '' })];
    const result = getEffectHtml(effects);
    expect(result).toBe('');
  });
});