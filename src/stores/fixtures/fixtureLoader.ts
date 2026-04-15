import { DataRouter } from '@/stores/adapters/dataRouter';

/**
 * Загружает fixtures из публичного файла и применяет их в сторы через DataRouter.
 * Путь к файлу можно переопределить через `VITE_FIXTURES_PATH` (по умолчанию `/fixtures.json`).
 * Применяется только если `VITE_USE_FIXTURES` установлено в `true`.
 */
export async function applyFixturesIfEnabled(): Promise<void> {
  try {
    const useFixtures = import.meta.env.VITE_USE_FIXTURES === 'true';
    if (!useFixtures) return;

    const path = import.meta.env.VITE_FIXTURES_PATH ?? '/SkyrimWebMonitor/fixtures.json';
    console.log(`[FixtureLoader] VITE_USE_FIXTURES enabled — loading fixtures from ${path}`);

    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(`[FixtureLoader] Failed to fetch fixtures: ${res.status} ${res.statusText}`);
      return;
    }

    const data = await res.json();
    if (!data || typeof data !== 'object') {
      console.warn('[FixtureLoader] Invalid fixture format, expected object mapping id->fields');
      return;
    }

    for (const [subscriptionId, fields] of Object.entries(data)) {
      try {
        const result = DataRouter.routeDataById(subscriptionId, fields);
        if (!result.success) {
          console.warn(`[FixtureLoader] Routing fixture for ${subscriptionId} failed: ${result.message}`);
        } else {
          console.log(`[FixtureLoader] Applied fixture for ${subscriptionId}`);
        }
      } catch (err) {
        console.error(`[FixtureLoader] Error applying fixture ${subscriptionId}:`, err);
      }
    }

    console.log('[FixtureLoader] All fixtures processed');
  } catch (err) {
    console.error('[FixtureLoader] Failed to load/apply fixtures:', err);
  }
}

export default applyFixturesIfEnabled;
