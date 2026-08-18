import { describe, it, expect, beforeEach } from 'vitest';
import { readManifest, writeManifest, readSvg, writeSvg, clearAll } from '../helpers/gfxDb';
import type { GfxIconsManifest } from '../lib/types';

describe('gfxDb', () => {
  beforeEach(async () => {
    await clearAll();
  });

  describe('manifest', () => {
    it('returns null when no manifest is stored', async () => {
      expect(await readManifest()).toBeNull();
    });

    it('writes and reads a valid manifest', async () => {
      const manifest: GfxIconsManifest = {
        ready: true,
        shapeCount: 403,
        shapeIds: [139, 711],
        generatedAt: '2026-01-01T00:00:00.000Z',
      };
      await writeManifest(manifest);

      const restored = await readManifest();
      expect(restored).not.toBeNull();
      if (restored) {
        expect(restored.ready).toBe(true);
        expect(restored.shapeCount).toBe(403);
        expect(restored.shapeIds).toEqual([139, 711]);
        expect(restored.generatedAt).toBe('2026-01-01T00:00:00.000Z');
      }
    });

    it('returns null for manifest with wrong shape', async () => {
      const { openDB } = await import('idb');
      const db = await openDB('gfx-icons', 1);
      await db.put('manifest', { id: 'main', ready: 'yes' });
      db.close();

      expect(await readManifest()).toBeNull();
    });
  });

  describe('svg', () => {
    it('returns null for missing shapeId', async () => {
      expect(await readSvg(999)).toBeNull();
    });

    it('writes and reads an SVG string', async () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0"/></svg>';
      await writeSvg(139, svg);

      const restored = await readSvg(139);
      expect(restored).toBe(svg);
    });

    it('stores different shapeIds independently', async () => {
      await writeSvg(1, 'svg-1');
      await writeSvg(2, 'svg-2');

      expect(await readSvg(1)).toBe('svg-1');
      expect(await readSvg(2)).toBe('svg-2');
    });

    it('updates an existing shapeId', async () => {
      await writeSvg(1, 'svg-old');
      await writeSvg(1, 'svg-new');

      expect(await readSvg(1)).toBe('svg-new');
    });
  });

  describe('clearAll', () => {
    it('removes the manifest', async () => {
      await writeManifest({
        ready: true,
        shapeCount: 1,
        shapeIds: [1],
        generatedAt: '2026-01-01T00:00:00.000Z',
      });
      await clearAll();
      expect(await readManifest()).toBeNull();
    });

    it('removes all SVGs', async () => {
      await writeSvg(1, 'svg-1');
      await writeSvg(2, 'svg-2');
      await writeManifest({
        ready: true,
        shapeCount: 2,
        shapeIds: [1, 2],
        generatedAt: '2026-01-01T00:00:00.000Z',
      });

      await clearAll();

      expect(await readSvg(1)).toBeNull();
      expect(await readSvg(2)).toBeNull();
      expect(await readManifest()).toBeNull();
    });
  });
});