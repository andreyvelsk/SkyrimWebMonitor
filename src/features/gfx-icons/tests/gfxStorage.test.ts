import { describe, it, expect, beforeEach } from 'vitest';
import { readManifest, writeManifest, readSvg, writeSvg, clearAll } from '../helpers/gfxStorage';
import type { GfxIconsManifest } from '../lib/types';

describe('gfxStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('manifest', () => {
    it('returns null when no manifest is stored', () => {
      expect(readManifest()).toBeNull();
    });

    it('writes and reads a valid manifest', () => {
      const manifest: GfxIconsManifest = {
        ready: true,
        shapeCount: 403,
        shapeIds: [139, 711],
        generatedAt: '2026-01-01T00:00:00.000Z',
      };
      writeManifest(manifest);

      const restored = readManifest();
      expect(restored).not.toBeNull();
      if (restored) {
        expect(restored.ready).toBe(true);
        expect(restored.shapeCount).toBe(403);
        expect(restored.shapeIds).toEqual([139, 711]);
        expect(restored.generatedAt).toBe('2026-01-01T00:00:00.000Z');
      }
    });

    it('returns null for corrupted manifest', () => {
      localStorage.setItem('gfx-icons:v1:manifest', 'not-json');
      expect(readManifest()).toBeNull();
    });

    it('returns null for manifest with wrong shape', () => {
      localStorage.setItem('gfx-icons:v1:manifest', JSON.stringify({ ready: 'yes' }));
      expect(readManifest()).toBeNull();
    });
  });

  describe('svg', () => {
    it('returns null for missing shapeId', () => {
      expect(readSvg(999)).toBeNull();
    });

    it('writes and reads an SVG string', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0"/></svg>';
      writeSvg(139, svg);

      const restored = readSvg(139);
      expect(restored).toBe(svg);
    });

    it('stores different shapeIds independently', () => {
      writeSvg(1, 'svg-1');
      writeSvg(2, 'svg-2');

      expect(readSvg(1)).toBe('svg-1');
      expect(readSvg(2)).toBe('svg-2');
    });
  });

  describe('clearAll', () => {
    it('removes the manifest', () => {
      writeManifest({ ready: true, shapeCount: 1, shapeIds: [1], generatedAt: '2026-01-01T00:00:00.000Z' });
      clearAll();
      expect(readManifest()).toBeNull();
    });
  });
});