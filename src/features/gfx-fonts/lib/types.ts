/**
 * Types for the gfx-fonts feature.
 */

/** Metadata stored alongside cached fonts to track readiness. */
export interface GfxFontsManifest {
  ready: boolean;
  fontNames: string[];
  generatedAt: string;
}

/** A single cached font record in the `fonts` object store. */
export interface GfxFontRecord {
  fontName: string;
  ttfBase64: string;
  updatedAt: string;
}

/** The manifest record stored in the `manifest` object store. */
export interface GfxFontsManifestRecord extends GfxFontsManifest {
  id: string;
}