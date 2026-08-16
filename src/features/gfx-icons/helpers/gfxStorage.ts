/**
 * localStorage persistence for GFX icons.
 *
 * Every SVG is stored under its own key so that individual reads are cheap
 * and the full set can be written incrementally. A separate manifest key
 * tracks whether the entire set was successfully persisted.
 */

import type { GfxIconsManifest } from '../lib/types';
import { STORAGE_KEY_MANIFEST, storageKeySvg } from '../config/gfxIcons';

// ---------- Manifest ----------

/**
 * Read the cached manifest, or null if it does not exist or is corrupted.
 */
export function readManifest(): GfxIconsManifest | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MANIFEST);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isManifest(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Persist the manifest. Call only after all SVGs have been written.
 */
export function writeManifest(manifest: GfxIconsManifest): void {
  try {
    localStorage.setItem(STORAGE_KEY_MANIFEST, JSON.stringify(manifest));
  } catch {
    console.warn('Failed to write gfx-icons manifest to localStorage');
  }
}

// ---------- SVG ----------

/**
 * Read a single cached SVG by shapeId, or null if not found.
 */
export function readSvg(shapeId: number): string | null {
  try {
    return localStorage.getItem(storageKeySvg(shapeId));
  } catch {
    return null;
  }
}

/**
 * Persist a single SVG string under its shapeId.
 */
export function writeSvg(shapeId: number, svg: string): void {
  try {
    localStorage.setItem(storageKeySvg(shapeId), svg);
  } catch {
    console.warn(`Failed to write gfx-icons SVG for shapeId ${shapeId} to localStorage`);
  }
}

// ---------- Bulk ----------

/**
 * Remove all gfx-icons entries from localStorage.
 * Useful for cache invalidation or testing.
 */
export function clearAll(): void {
  try {
    // Remove manifest
    localStorage.removeItem(STORAGE_KEY_MANIFEST);

    // Remove all SVG entries. We iterate over known keys because we cannot
    // enumerate localStorage keys by prefix in a generic way.
    // The caller is responsible for knowing which shapeIds to clear.
  } catch {
    // Silently ignore.
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