import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import ru from './locales/ru.json';
import type { SupportedLocale } from './lib/types';

export type { SupportedLocale };

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'ru'];

const GAME_LANGUAGE_MAP: Record<string, SupportedLocale> = {
  RUSSIAN: 'ru',
  ENGLISH: 'en',
};

export function mapGameLanguage(gameLang: string): SupportedLocale {
  return GAME_LANGUAGE_MAP[gameLang?.toUpperCase()] ?? 'en';
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    ru,
  },
});

export default i18n;
