/**
 * IndexedDB cache for rendered item thumbnails.
 *
 * One record per (renderer version, model path, material); the value is a
 * small WebP/PNG data URL. Rendering a thumbnail needs a model download and
 * texture decodes on the game side, so after the first view every later view
 * of the same item comes from here instantly — also across app restarts.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export const THUMBNAIL_DB_NAME = 'item-thumbnails';
export const THUMBNAIL_DB_VERSION = 1;
const STORE = 'thumbnails';

export interface ThumbnailRecord {
  key: string;
  url: string;
  createdAt: string;
}

interface ThumbnailDB extends DBSchema {
  thumbnails: {
    key: string;
    value: ThumbnailRecord;
  };
}

let dbPromise: Promise<IDBPDatabase<ThumbnailDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ThumbnailDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ThumbnailDB>(THUMBNAIL_DB_NAME, THUMBNAIL_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      },
    });
    dbPromise.catch((err) => {
      console.warn('[ItemThumbnails] Failed to open IndexedDB', err);
      dbPromise = null;
    });
  }
  return dbPromise;
}

export async function readThumbnail(key: string): Promise<string | null> {
  try {
    const db = await getDb();
    return (await db.get(STORE, key))?.url ?? null;
  } catch (err) {
    console.warn('[ItemThumbnails] Failed to read thumbnail', err);
    return null;
  }
}

export async function writeThumbnail(key: string, url: string): Promise<void> {
  try {
    const db = await getDb();
    await db.put(STORE, { key, url, createdAt: new Date().toISOString() });
  } catch (err) {
    console.warn('[ItemThumbnails] Failed to write thumbnail', err);
  }
}

export async function clearThumbnails(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch (err) {
    console.warn('[ItemThumbnails] Failed to clear thumbnails', err);
  }
}
