import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { readManifest, writeManifest, readFont, writeFont, clearAll } from '../helpers/gfxFontsDb';
import type { GfxFontsManifest } from '../lib/types';

describe('gfxFontsDb', () => {
  beforeEach(async () => {
    await clearAll();
  });

  describe('manifest', () => {
    it('returns null when no manifest is stored', async () => {
      expect(await readManifest()).toBeNull();
    });

    it('writes and reads a valid manifest', async () => {
      const manifest: GfxFontsManifest = {
        ready: true,
        fontNames: ['FuturaTCYLigCon', 'Daedric'],
        generatedAt: '2026-01-01T00:00:00.000Z',
      };
      await writeManifest(manifest);

      const restored = await readManifest();
      expect(restored).not.toBeNull();
      if (restored) {
        expect(restored.ready).toBe(true);
        expect(restored.fontNames).toEqual(['FuturaTCYLigCon', 'Daedric']);
        expect(restored.generatedAt).toBe('2026-01-01T00:00:00.000Z');
      }
    });

    it('returns null for invalid manifest shape', async () => {
      const { openDB } = await import('idb');
      const db = await openDB('gfx-fonts', 1);
      await db.put('manifest', { id: 'main', ready: 'yes' });
      db.close();

      expect(await readManifest()).toBeNull();
    });
  });

  describe('fonts', () => {
    it('returns null for missing fontName', async () => {
      expect(await readFont('NonExistentFont')).toBeNull();
    });

    it('writes and reads a TTF base64 string', async () => {
      const ttfBase64 = 'AAEAAAABAIAAAwB...'; // mock base64 TTF
      await writeFont('FuturaTCYLigCon', ttfBase64);

      const restored = await readFont('FuturaTCYLigCon');
      expect(restored).toBe(ttfBase64);
    });

    it('stores different fonts independently', async () => {
      await writeFont('FontA', 'base64-a');
      await writeFont('FontB', 'base64-b');

      expect(await readFont('FontA')).toBe('base64-a');
      expect(await readFont('FontB')).toBe('base64-b');
    });

    it('updates an existing font', async () => {
      await writeFont('FontA', 'base64-old');
      await writeFont('FontA', 'base64-new');

      expect(await readFont('FontA')).toBe('base64-new');
    });
  });

  describe('clearAll', () => {
    it('removes the manifest', async () => {
      await writeManifest({
        ready: true,
        fontNames: ['FuturaTCYLigCon'],
        generatedAt: '2026-01-01T00:00:00.000Z',
      });
      await clearAll();
      expect(await readManifest()).toBeNull();
    });

    it('removes all fonts', async () => {
      await writeFont('FontA', 'base64-a');
      await writeFont('FontB', 'base64-b');
      await writeManifest({
        ready: true,
        fontNames: ['FontA', 'FontB'],
        generatedAt: '2026-01-01T00:00:00.000Z',
      });

      await clearAll();

      expect(await readFont('FontA')).toBeNull();
      expect(await readFont('FontB')).toBeNull();
      expect(await readManifest()).toBeNull();
    });
  });
});