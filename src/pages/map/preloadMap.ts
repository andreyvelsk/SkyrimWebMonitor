/**
 * URL of the world map image. Centralized so both the map page and the
 * preloader reference the exact same URL, ensuring the browser actually
 * reuses the cached response.
 *
 * Uses Vite's BASE_URL so it works under any deploy base path.
 */
export const MAP_IMAGE_URL = `${import.meta.env.BASE_URL}map.jpg`;

let preloadStarted = false;
let preloadPromise: Promise<void> | null = null;

/**
 * Eagerly fetches the map image into the HTTP/memory cache so that opening
 * the Map tab renders instantly. Safe to call multiple times — the work is
 * performed only once per page load.
 */
export function preloadMapImage(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadStarted = true;

  preloadPromise = new Promise<void>((resolve) => {
    const img = new Image();
    const finish = (): void => resolve();
    img.onload = finish;
    img.onerror = finish;
    img.src = MAP_IMAGE_URL;
    // `decode()` parses the bitmap off the main thread when supported, so the
    // first paint inside the Map tab does not need to do that work.
    if (typeof img.decode === 'function') {
      img.decode().then(finish, finish);
    }
  });

  return preloadPromise;
}

export function isMapPreloadStarted(): boolean {
  return preloadStarted;
}
