/**
 * GFX icons feature configuration.
 *
 * Constants shared by the gfx-icons feature: the server-side file path,
 * localStorage key prefix and cache version.
 */

/** Path to the GFX file on the game server, relative to the Data folder. */
export const GFX_FILE_PATH = 'interface/exported/hudmenu.gfx';

/** localStorage key prefix for gfx icon cache entries. */
const STORAGE_PREFIX = 'gfx-icons';

/** Current cache version — bump to force re-download after format changes. */
const STORAGE_VERSION = 'v1';

/** localStorage key for the ready manifest. */
export const STORAGE_KEY_MANIFEST = `${STORAGE_PREFIX}:${STORAGE_VERSION}:manifest`;

/** localStorage key template for a single SVG icon. */
export function storageKeySvg(shapeId: number): string {
  return `${STORAGE_PREFIX}:${STORAGE_VERSION}:svg:${shapeId}`;
}