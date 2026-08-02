import { describe, it, expect } from 'vitest';
import { createMapProjection } from '@/pages/map/composables/useMapProjection';
import type { MapConfig } from '@/pages/map/config/lib/types';

// =============================================================
// Helper: build minimal MapConfig with a simple projection mesh
// =============================================================

/**
 * Build a minimal MapConfig with two triangles covering the specified
 * bounds. The triangles map world-space → normalized (u,v) then to image
 * pixels via imageWidth / imageHeight.
 */
function makeSimpleConfig(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  imageWidth: number = 4096,
  imageHeight: number = 4096,
): MapConfig {
  return {
    worldspace: 'TestWorld',
    dziUrl: '/test.dzi',
    cropX: 0,
    cropYTop: 0,
    cropYBottom: 0,
    projectionData: {
      source: 'test',
      meshName: 'TestMesh',
      blockIndex: 0,
      texturePaths: [],
      imageWidth,
      imageHeight,
      vertexStride: 4,
      triangleStride: 3,
      vertices: [
        // Triangle 1: maps world bounds to full UV space (0,0)-(1,0)-(0,1)
        bounds.minX, bounds.minY, 0, 0, // vertex 0: world (minX, minY) → UV (0,0)
        bounds.maxX, bounds.minY, 1, 0, // vertex 1: world (maxX, minY) → UV (1,0)
        bounds.minX, bounds.maxY, 0, 1, // vertex 2: world (minX, maxY) → UV (0,1)
        // Triangle 2: covers the other half
        bounds.maxX, bounds.minY, 1, 0, // vertex 3
        bounds.maxX, bounds.maxY, 1, 1, // vertex 4
        bounds.minX, bounds.maxY, 0, 1, // vertex 5
      ],
      triangles: [0, 1, 2, 3, 4, 5],
      bounds: {
        minX: bounds.minX,
        minY: bounds.minY,
        maxX: bounds.maxX,
        maxY: bounds.maxY,
        minU: 0,
        minV: 0,
        maxU: 1,
        maxV: 1,
      },
    },
  };
}

describe('createMapProjection', () => {
  const config = makeSimpleConfig(
    { minX: -100, minY: -100, maxX: 100, maxY: 100 },
  );
  const projection = createMapProjection(config);

  it('projects a point inside bounds correctly', () => {
    // Center of world → center of image
    const result = projection.projectWorldToImage({ x: 0, y: 0 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x).toBeCloseTo(2048, 0);
      expect(result.y).toBeCloseTo(2048, 0);
    }
  });

  it('projects origin (minX, minY) to image origin', () => {
    const result = projection.projectWorldToImage({ x: -100, y: -100 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
    }
  });

  it('projects (maxX, maxY) to image corner', () => {
    const result = projection.projectWorldToImage({ x: 100, y: 100 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x).toBeCloseTo(4096, 0);
      expect(result.y).toBeCloseTo(4096, 0);
    }
  });

  it('returns null for point outside bounds', () => {
    const result = projection.projectWorldToImage({ x: 200, y: 0 });
    expect(result).toBeNull();
  });

  it('returns null for NaN input', () => {
    expect(projection.projectWorldToImage({ x: NaN, y: 0 })).toBeNull();
    expect(projection.projectWorldToImage({ x: 0, y: NaN })).toBeNull();
  });

  it('returns null for Infinity input', () => {
    expect(projection.projectWorldToImage({ x: Infinity, y: 0 })).toBeNull();
    expect(projection.projectWorldToImage({ x: 0, y: -Infinity })).toBeNull();
  });

  it('provides correct image dimensions', () => {
    expect(projection.imageWidth).toBe(4096);
    expect(projection.imageHeight).toBe(4096);
  });

  it('provides mesh name', () => {
    expect(projection.meshName).toBe('TestMesh');
  });
});

describe('createMapProjection with image correction', () => {
  const config: MapConfig = {
    ...makeSimpleConfig({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, 1000, 1000),
    imageCorrection: { a: 2, b: 0, c: 0, d: 2, e: 10, f: 20 },
  };
  const projection = createMapProjection(config);

  it('applies image correction matrix', () => {
    // Without correction: point (5,5) → (500, 500)
    // With correction (scale 2, translate 10,20): (1010, 1020)
    const result = projection.projectWorldToImage({ x: 5, y: 5 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x).toBeCloseTo(1010, 0);
      expect(result.y).toBeCloseTo(1020, 0);
    }
  });
});

describe('createMapProjection edge cases', () => {
  it('handles point on boundary', () => {
    const config = makeSimpleConfig({ minX: 0, minY: 0, maxX: 10, maxY: 10 }, 100, 100);
    const projection = createMapProjection(config);

    // On the edge — should be inside bounds
    const result = projection.projectWorldToImage({ x: 0, y: 5 });
    expect(result).not.toBeNull();
  });

  it('handles custom image dimensions', () => {
    const config = makeSimpleConfig({ minX: 0, minY: 0, maxX: 100, maxY: 100 }, 800, 600);
    const projection = createMapProjection(config);
    const result = projection.projectWorldToImage({ x: 50, y: 50 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.x).toBeCloseTo(400, 0);
      expect(result.y).toBeCloseTo(300, 0);
    }
  });
});