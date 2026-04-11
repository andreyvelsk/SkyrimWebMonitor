import { i18n, mapGameLanguage } from '@/i18n';

export const LANG_QUERY_ID = 'lang';
export const LANG_QUERY_FIELDS = { language: 'Game::Language' };

export function handleLangQueryResponse(fields: Record<string, unknown>): void {
  const gameLang = (fields.language ?? fields.lang) as string | undefined;
  if (gameLang) {
    i18n.global.locale.value = mapGameLanguage(gameLang);
    console.log(`[LocaleAdapter] Game language: ${gameLang} → locale: ${i18n.global.locale.value}`);
  }
}
