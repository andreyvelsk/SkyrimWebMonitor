/**
 * Public storage API for GFX icons.
 *
 * Thin re-export of the IndexedDB-backed implementation in gfxDb.ts.
 * All functions are async and return Promises.
 */

export {
  readManifest,
  writeManifest,
  readSvg,
  writeSvg,
  clearAll,
} from './gfxDb';