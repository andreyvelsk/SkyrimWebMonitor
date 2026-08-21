/**
 * IndexedDB persistence for GFX fonts.
 *
 * Every font is stored in the `fonts` object store keyed by fontName so that
 * individual reads are cheap and the full set can be written incrementally.
 * A separate `manifest` object store tracks whether the entire set was
 * successfully persisted.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { GfxFontRecord, GfxFontsManifest, GfxFontsManifestRecord } from '../lib/types';
import {
  FONTS_DB_NAME, FONTS_DB_VERSION, FONTS_MANIFEST_ID,
  FONTS_STORE, FONTS_MANIFEST_STORE,
} from '../config/gfxFonts';

// ---------- DB schema ----------

interface GfxFontsDB extends DBSchema {
  fonts: { key: string; value: GfxFontRecord };
  manifest: { key: string; value: GfxFontsManifestRecord };
}

// ---------- Connection ----------

let dbPromise: Promise<IDBPDatabase<GfxFontsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<GfxFontsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GfxFontsDB>(FONTS_DB_NAME, FONTS_DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(FONTS_STORE)) {
          db.createObjectStore(FONTS_STORE, { keyPath: 'fontName' });
        }
        if (!db.objectStoreNames.contains(FONTS_MANIFEST_STORE)) {
          db.createObjectStore(FONTS_MANIFEST_STORE, { keyPath: 'id' });
        }
      },
    });
    // On failure, clear the cached promise so the next call can retry.
    dbPromise.catch((err) => {
      console.warn('Failed to open gfx-fonts IndexedDB', err);
      dbPromise = null;
    });
  }
  return dbPromise;
}

// ---------- Manifest ----------

/**
 * Read the cached manifest, or null if it does not exist or is corrupted.
 */
export async function readManifest(): Promise<GfxFontsManifest | null> {
  try {
    const db = await getDb();
    const record = await db.get(FONTS_MANIFEST_STORE, FONTS_MANIFEST_ID);
    if (!record) return null;

    const { id: _id, ...manifest } = record;
    if (!isManifest(manifest)) return null;

    return manifest;
  } catch (err) {
    console.warn('Failed to read gfx-fonts manifest from IndexedDB', err);
    return null;
  }
}

/**
 * Persist the manifest. Call only after all fonts have been written.
 */
export async function writeManifest(manifest: GfxFontsManifest): Promise<void> {
  try {
    const db = await getDb();
    await db.put(FONTS_MANIFEST_STORE, { id: FONTS_MANIFEST_ID, ...manifest });
  } catch (err) {
    console.warn('Failed to write gfx-fonts manifest to IndexedDB', err);
  }
}

// ---------- Font ----------

/**
 * Read a single cached TTF font by fontName as base64, or null if not found.
 */
export async function readFont(fontName: string): Promise<string | null> {
  try {
    const db = await getDb();
    const record = await db.get(FONTS_STORE, fontName);
    return record?.ttfBase64 ?? null;
  } catch (err) {
    console.warn(`Failed to read font ${fontName} from IndexedDB`, err);
    return null;
  }
}

/**
 * Persist a single TTF font under its fontName.
 * Uses `put` so that re-writing an existing fontName updates the record.
 */
export async function writeFont(fontName: string, ttfBase64: string): Promise<void> {
  try {
    const db = await getDb();
    const record: GfxFontRecord = {
      fontName,
      ttfBase64,
      updatedAt: new Date().toISOString(),
    };
    await db.put(FONTS_STORE, record);
  } catch (err) {
    console.warn(`Failed to write font ${fontName} to IndexedDB`, err);
  }
}

// ---------- Bulk ----------

/**
 * Remove all gfx-fonts entries from IndexedDB (both object stores).
 */
export async function clearAll(): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction([FONTS_STORE, FONTS_MANIFEST_STORE], 'readwrite');
    await tx.objectStore(FONTS_STORE).clear();
    await tx.objectStore(FONTS_MANIFEST_STORE).clear();
    await tx.done;
  } catch (err) {
    console.warn('Failed to clear gfx-fonts IndexedDB', err);
  }
}

// ---------- Type guard ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isManifest(value: unknown): value is GfxFontsManifest {
  if (!isRecord(value)) return false;
  if (typeof value.ready !== 'boolean') return false;
  if (!Array.isArray(value.fontNames)) return false;
  if (typeof value.generatedAt !== 'string') return false;
  return value.fontNames.every((n: unknown) => typeof n === 'string');
}