/**
 * IndexedDB persistence for GFX icons.
 *
 * Every SVG is stored in the `icons` object store keyed by shapeId so that
 * individual reads are cheap and the full set can be written incrementally.
 * A separate `manifest` object store tracks whether the entire set was
 * successfully persisted.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { GfxIconRecord, GfxIconsManifest, GfxManifestRecord } from '../lib/types';
import {
  GFX_DB_NAME,
  GFX_DB_VERSION,
  GFX_MANIFEST_ID,
  GFX_STORE_ICONS,
  GFX_STORE_MANIFEST,
} from '../config/gfxIcons';

// ---------- DB schema ----------

interface GfxIconsDB extends DBSchema {
  icons: {
    key: number;
    value: GfxIconRecord;
  };
  manifest: {
    key: string;
    value: GfxManifestRecord;
  };
}

// ---------- Connection ----------

let dbPromise: Promise<IDBPDatabase<GfxIconsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<GfxIconsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GfxIconsDB>(GFX_DB_NAME, GFX_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(GFX_STORE_ICONS)) {
          db.createObjectStore(GFX_STORE_ICONS, { keyPath: 'shapeId' });
        }
        if (!db.objectStoreNames.contains(GFX_STORE_MANIFEST)) {
          db.createObjectStore(GFX_STORE_MANIFEST, { keyPath: 'id' });
        }
      },
    });
    // On failure, clear the cached promise so the next call can retry.
    dbPromise.catch((err) => {
      console.warn('Failed to open gfx-icons IndexedDB', err);
      dbPromise = null;
    });
  }
  return dbPromise;
}

// ---------- Manifest ----------

/**
 * Read the cached manifest, or null if it does not exist or is corrupted.
 */
export async function readManifest(): Promise<GfxIconsManifest | null> {
  try {
    const db = await getDb();
    const record = await db.get(GFX_STORE_MANIFEST, GFX_MANIFEST_ID);
    if (!record) return null;

    const { id: _id, ...manifest } = record;
    if (!isManifest(manifest)) return null;

    return manifest;
  } catch (err) {
    console.warn('Failed to read gfx-icons manifest from IndexedDB', err);
    return null;
  }
}

/**
 * Persist the manifest. Call only after all SVGs have been written.
 */
export async function writeManifest(manifest: GfxIconsManifest): Promise<void> {
  try {
    const db = await getDb();
    await db.put(GFX_STORE_MANIFEST, { id: GFX_MANIFEST_ID, ...manifest });
  } catch (err) {
    console.warn('Failed to write gfx-icons manifest to IndexedDB', err);
  }
}

// ---------- SVG ----------

/**
 * Read a single cached SVG by shapeId, or null if not found.
 */
export async function readSvg(shapeId: number): Promise<string | null> {
  try {
    const db = await getDb();
    const record = await db.get(GFX_STORE_ICONS, shapeId);
    return record?.svg ?? null;
  } catch (err) {
    console.warn(`Failed to read gfx-icons SVG for shapeId ${shapeId} from IndexedDB`, err);
    return null;
  }
}

/**
 * Persist a single SVG string under its shapeId.
 * Uses `put` so that re-writing an existing shapeId updates the record.
 */
export async function writeSvg(shapeId: number, svg: string): Promise<void> {
  try {
    const db = await getDb();
    const record: GfxIconRecord = {
      shapeId,
      svg,
      updatedAt: new Date().toISOString(),
    };
    await db.put(GFX_STORE_ICONS, record);
  } catch (err) {
    console.warn(`Failed to write gfx-icons SVG for shapeId ${shapeId} to IndexedDB`, err);
  }
}

// ---------- Bulk ----------

/**
 * Remove all gfx-icons entries from IndexedDB (both object stores).
 */
export async function clearAll(): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction([GFX_STORE_ICONS, GFX_STORE_MANIFEST], 'readwrite');
    await tx.objectStore(GFX_STORE_ICONS).clear();
    await tx.objectStore(GFX_STORE_MANIFEST).clear();
    await tx.done;
  } catch (err) {
    console.warn('Failed to clear gfx-icons IndexedDB', err);
  }
}

// ---------- Type guard ----------

function isManifest(value: unknown): value is GfxIconsManifest {
  if (typeof value !== 'object' || value === null) return false;

  if (!('ready' in value) || typeof value.ready !== 'boolean') return false;
  if (!('shapeCount' in value) || typeof value.shapeCount !== 'number') return false;
  if (!('generatedAt' in value) || typeof value.generatedAt !== 'string') return false;

  if (!('shapeIds' in value)) return false;
  const shapeIds: unknown = value.shapeIds;
  if (!Array.isArray(shapeIds)) return false;
  return shapeIds.every((id: unknown) => typeof id === 'number');
}