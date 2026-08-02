import { describe, it, expect } from 'vitest';
import { solveAffineLeastSquares, solveAffine } from '@/pages/map/composables/useMapCoordinates';
import type { Point } from '@/pages/map/lib/types';

// =============================================================
// Map Math tests
// =============================================================

describe('solveAffineLeastSquares', () => {
  it('returns null for fewer than 3 points', () => {
    const src: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    const dst: Point[] = [{ x: 0, y: 0 }, { x: 2, y: 2 }];
    expect(solveAffineLeastSquares(src, dst)).toBeNull();
  });

  it('returns null for mismatched lengths', () => {
    const src: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }];
    const dst: Point[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];
    expect(solveAffineLeastSquares(src, dst)).toBeNull();
  });

  it('solves exact 3-point identity affine correctly', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const dst: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const result = solveAffineLeastSquares(src, dst);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.a).toBeCloseTo(1, 10);
      expect(result.b).toBeCloseTo(0, 10);
      expect(result.c).toBeCloseTo(0, 10);
      expect(result.d).toBeCloseTo(1, 10);
      expect(result.e).toBeCloseTo(0, 10);
      expect(result.f).toBeCloseTo(0, 10);
    }
  });

  it('solves translation-only affine', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const dst: Point[] = [
      { x: 10, y: 20 },
      { x: 11, y: 20 },
      { x: 10, y: 21 },
    ];
    const result = solveAffineLeastSquares(src, dst);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.a).toBeCloseTo(1, 10);
      expect(result.b).toBeCloseTo(0, 10);
      expect(result.c).toBeCloseTo(0, 10);
      expect(result.d).toBeCloseTo(1, 10);
      expect(result.e).toBeCloseTo(10, 10);
      expect(result.f).toBeCloseTo(20, 10);
    }
  });

  it('solves scale-only affine', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const dst: Point[] = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 3 },
    ];
    const result = solveAffineLeastSquares(src, dst);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.a).toBeCloseTo(2, 10);
      expect(result.b).toBeCloseTo(0, 10);
      expect(result.c).toBeCloseTo(0, 10);
      expect(result.d).toBeCloseTo(3, 10);
      expect(result.e).toBeCloseTo(0, 10);
      expect(result.f).toBeCloseTo(0, 10);
    }
  });

  it('returns null for collinear points', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const dst: Point[] = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ];
    const result = solveAffineLeastSquares(src, dst);
    expect(result).toBeNull();
  });

  it('solves with N > 3 (least squares)', () => {
    // 9 non-collinear points on a known affine transform:
    // dst.x = 2*src.x + 0*src.y + 10  → a=2, c=0, e=10
    // dst.y = 0*src.x + 3*src.y + 20  → b=0, d=3, f=20
    const src: Point[] = [];
    const dst: Point[] = [];
    const points: Array<[number, number]> = [
      [0, 0], [1, 3], [2, 1], [3, 5], [4, 2], [5, 7], [6, 4], [7, 8], [8, 6],
    ];
    for (const [px, py] of points) {
      src.push({ x: px, y: py });
      dst.push({ x: px * 2 + 10, y: py * 3 + 20 });
    }
    const result = solveAffineLeastSquares(src, dst);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.a).toBeCloseTo(2, 10);
      expect(result.b).toBeCloseTo(0, 10);
      expect(result.c).toBeCloseTo(0, 10);
      expect(result.d).toBeCloseTo(3, 10);
      expect(result.e).toBeCloseTo(10, 10);
      expect(result.f).toBeCloseTo(20, 10);
    }
  });

  it('is symmetric: src↔dst swap inverts', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const dst: Point[] = [
      { x: 10, y: 20 },
      { x: 12, y: 20 },
      { x: 10, y: 23 },
    ];
    const forward = solveAffineLeastSquares(src, dst);
    const backward = solveAffineLeastSquares(dst, src);
    expect(forward).not.toBeNull();
    expect(backward).not.toBeNull();
    if (forward && backward) {
      // Composition should be approximately identity
      const composedA = forward.a * backward.a + forward.c * backward.b;
      const composedB = forward.b * backward.a + forward.d * backward.b;
      expect(composedA).toBeCloseTo(1, 8);
      expect(composedB).toBeCloseTo(0, 8);
    }
  });
});

describe('solveAffine', () => {
  it('delegates to solveAffineLeastSquares for 3 points', () => {
    const src: [Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    const dst: [Point, Point, Point] = [
      { x: 10, y: 20 },
      { x: 11, y: 20 },
      { x: 10, y: 21 },
    ];
    const result = solveAffine(src, dst);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.e).toBeCloseTo(10, 10);
      expect(result.f).toBeCloseTo(20, 10);
    }
  });

  it('returns null for collinear 3 points', () => {
    const src: [Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    const dst: [Point, Point, Point] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ];
    expect(solveAffine(src, dst)).toBeNull();
  });
});