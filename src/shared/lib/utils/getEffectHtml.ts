import type { ItemEnchantmentEffect } from '@/stores/inventory/types';

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatEffectHtml(e: ItemEnchantmentEffect, isSurvivalMode: boolean): string {
  if (!e.descriptionTemplate) return '';

  let tpl = e.descriptionTemplate;

  // Handle survival-specific templates: [SURV=...]
  // - when isSurvivalMode === true: replace occurrences with inner text
  // - when isSurvivalMode === false: remove occurrences; if template becomes empty, ignore effect
  const survRe = /\[SURV=(.*?)\]/g;
  if (survRe.test(tpl)) {
    if (isSurvivalMode) {
      tpl = tpl.replace(survRe, (_m, inner) => inner ?? '');
    } else {
      tpl = tpl.replace(survRe, '');
      if (!tpl.trim()) return '';
    }
  }

  // Collect placeholder replacements so they survive escaping
  const placeholders: Record<string, string> = {};
  let idx = 0;

  // <mag> -> magnitude value
  if (/<mag>/.test(tpl)) {
    const key = `___PL_MAG___`;
    placeholders[key] = `<strong>${escapeHtml(String(e.magnitude ?? ''))}</strong>`;
    tpl = tpl.replace(/<mag>/g, key);
  }

  // <dur> -> duration value
  if (/<dur>/.test(tpl)) {
    const key = `___PL_DUR___`;
    placeholders[key] = `<strong>${escapeHtml(String(e.duration ?? ''))}</strong>`;
    tpl = tpl.replace(/<dur>/g, key);
  }

  // Numeric tags like <50> -> <strong>50</strong>
  tpl = tpl.replace(/<(\d+)>/g, (_match, digits: string) => {
    const key = `___PL_NUM_${idx++}___`;
    placeholders[key] = `<strong>${escapeHtml(digits)}</strong>`;
    return key;
  });

  // Escape remaining content to avoid injecting unintended HTML
  tpl = escapeHtml(tpl);

  // Restore placeholders with their HTML replacements
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const key of Object.keys(placeholders)) {
    tpl = tpl.replace(new RegExp(escapeRegExp(key), 'g'), placeholders[key]);
  }

  return tpl;
}

export function getEffectHtml(
  effects: ItemEnchantmentEffect[] | null | undefined,
  isSurvivalMode: boolean = false
): string {
  if (!effects || !effects.length) return '';
  return effects.map((effect) => formatEffectHtml(effect, isSurvivalMode)).join(' ');
}
