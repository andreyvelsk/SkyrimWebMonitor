/**
 * GFX fonts feature configuration.
 *
 * Constants shared by the gfx-fonts feature: the server-side file paths,
 * IndexedDB database / object store configuration, and primary font name.
 */

/** Path to RU font file on the game server. */
export const FONTS_FILE_PATH_RU = 'interface/fonts_ru.swf';

/** Path to EN font file on the game server. */
export const FONTS_FILE_PATH_EN = 'interface/fonts_en.swf';

/** IndexedDB database name for font cache. */
export const FONTS_DB_NAME = 'gfx-fonts';

/** Current database version. */
export const FONTS_DB_VERSION = 1;

/** Object store name for individual font records (keyPath: fontName). */
export const FONTS_STORE = 'fonts';

/** Object store name for the ready manifest (keyPath: id). */
export const FONTS_MANIFEST_STORE = 'manifest';

/** Fixed key of the single manifest record. */
export const FONTS_MANIFEST_ID = 'main';

/** Name of the primary Skyrim font to use. */
export const PRIMARY_FONT_NAME = 'FuturaTCYLigCon';