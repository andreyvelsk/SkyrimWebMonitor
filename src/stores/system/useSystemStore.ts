import { defineStore } from 'pinia';
import { ref } from 'vue';
import { i18n, mapGameLanguage } from '@/i18n';
import { logger } from '@/shared/lib/utils/logger';
import type { Feature, Features } from './types';

export const SYSTEM_QUERY_ID = 'system';
export const SYSTEM_QUERY_FIELDS = {
  language: 'Game::Language',
  features: 'App::Features',
};

export const useSystemStore = defineStore('system', () => {
  const language = ref<string | null>(null);
  const features = ref<Features>([]);

  function handleQueryResponse(fields: Record<string, unknown>): void {
    const rawLang = fields.language ?? fields.lang;
    const gameLang: string | undefined = typeof rawLang === 'string' ? rawLang : undefined;
    if (gameLang) {
      language.value = gameLang;
      i18n.global.locale.value = mapGameLanguage(gameLang);
      logger.log(`[SystemStore] Game language: ${gameLang} → locale: ${i18n.global.locale.value}`);
    }

    const rawFeatures = fields.features;
    if (Array.isArray(rawFeatures)) {
      features.value = rawFeatures;
      logger.log('[SystemStore] Features:', features.value);
    }
  }

  function reset(): void {
    language.value = null;
    features.value = [];
  }

  function isFeatureProvided(feature: Feature): boolean {
    return features.value.includes(feature);
  }

  return {
    language,
    features,
    isFeatureProvided,
    handleQueryResponse,
    reset,
  };
});
