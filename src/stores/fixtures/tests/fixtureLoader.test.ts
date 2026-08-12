import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { RouterResult } from '@/stores/adapters/lib/types';

// =============================================================
// Mocks
// =============================================================

const mockRouteDataById = vi.fn();

vi.mock('@/stores/adapters/dataRouter', () => ({
  DataRouter: {
    routeDataById: (...args: unknown[]): RouterResult => {
      return mockRouteDataById(...args) as RouterResult; // eslint-disable-line @typescript-eslint/consistent-type-assertions
    },
  },
}));

// Mock logger to suppress output in tests
vi.mock('@/shared/lib/utils/logger', () => ({
  logger: {
    log: vi.fn(),
  },
}));

// =============================================================
// Fixture Loader tests
// =============================================================

describe('applyFixturesIfEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteDataById.mockReset();
    mockRouteDataById.mockReturnValue({ success: true, message: 'OK' });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not load fixtures when VITE_USE_FIXTURES is not set', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'false');

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('does not load fixtures when VITE_USE_FIXTURES is unset', async () => {
    // VITE_USE_FIXTURES is not defined at all
    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('loads and applies fixtures when VITE_USE_FIXTURES is true', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    const fixtureData = {
      'character.stats': { health: 100 },
      'inventory.weapons': { items: [] },
    };

    // Mock fetch
    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fixtureData),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRouteDataById).toHaveBeenCalledTimes(2);
    expect(mockRouteDataById).toHaveBeenCalledWith('character.stats', { health: 100 });
    expect(mockRouteDataById).toHaveBeenCalledWith('inventory.weapons', { items: [] });
  });

  it('does not fail on fetch error', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    // Should not throw, should not route any data
    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('does not fail when fetch throws network error', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    const mockFetch = vi.fn(() => Promise.reject(new Error('Network error')));
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    // Should not throw
    await expect(applyFixturesIfEnabled()).resolves.toBeUndefined();
    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('processes categories before content data', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    // Categories should come first regardless of key order in the object
    const fixtureData = {
      'inventory.weapons': { items: [] },
      'magic.destruction': { items: [] },
      'inventory.categories': { categories: [] },
      'magic.categories': { categories: [] },
    };

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fixtureData),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockRouteDataById).toHaveBeenCalledTimes(4);

    // Categories must come first
    const calls = mockRouteDataById.mock.calls.map((c: unknown[]) => c[0]);
    const catIdx1 = calls.indexOf('inventory.categories');
    const catIdx2 = calls.indexOf('magic.categories');
    const wepIdx = calls.indexOf('inventory.weapons');
    const destIdx = calls.indexOf('magic.destruction');

    expect(catIdx1).toBeLessThan(wepIdx);
    expect(catIdx2).toBeLessThan(wepIdx);
    expect(catIdx1).toBeLessThan(destIdx);
    expect(catIdx2).toBeLessThan(destIdx);
  });

  it('handles invalid fixture format (non-object)', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve('not an object'),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    // Should not route any data for non-object
    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('handles null fixture data', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockRouteDataById).not.toHaveBeenCalled();
  });

  it('continues processing after a failed routing', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');

    mockRouteDataById
      .mockReturnValueOnce({ success: false, message: 'Bad data' })
      .mockReturnValueOnce({ success: true, message: 'OK' });

    const fixtureData = {
      'bad.id': { broken: true },
      'character.stats': { health: 50 },
    };

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(fixtureData),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    // Both entries should be attempted
    expect(mockRouteDataById).toHaveBeenCalledTimes(2);
  });

  it('uses VITE_FIXTURES_PATH if provided', async () => {
    vi.stubEnv('VITE_USE_FIXTURES', 'true');
    vi.stubEnv('VITE_FIXTURES_PATH', '/custom/fixtures.json');

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );
    vi.stubGlobal('fetch', mockFetch);

    const { default: applyFixturesIfEnabled } = await import('@/stores/fixtures/fixtureLoader');
    await applyFixturesIfEnabled();

    expect(mockFetch).toHaveBeenCalledWith('/custom/fixtures.json', { cache: 'no-store' });
  });
});