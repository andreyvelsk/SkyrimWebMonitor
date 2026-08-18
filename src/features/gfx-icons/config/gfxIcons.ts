/**
 * GFX icons feature configuration.
 *
 * Constants shared by the gfx-icons feature: the server-side file path and
 * IndexedDB database / object store configuration.
 */

/** Path to the GFX file on the game server, relative to the Data folder. */
export const GFX_FILE_PATH = 'interface/exported/hudmenu.gfx';

/** IndexedDB database name for gfx icon cache. */
export const GFX_DB_NAME = 'gfx-icons';

/** Current database version — bump to force re-creation after schema changes. */
export const GFX_DB_VERSION = 1;

/** Object store name for individual SVG icons (keyPath: shapeId). */
export const GFX_STORE_ICONS = 'icons';

/** Object store name for the ready manifest (keyPath: id). */
export const GFX_STORE_MANIFEST = 'manifest';

/** Fixed key of the single manifest record. */
export const GFX_MANIFEST_ID = 'main';