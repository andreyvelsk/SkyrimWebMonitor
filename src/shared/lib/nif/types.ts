/** One drawable triangle mesh, already transformed into model space. */
export interface NifMesh {
  name: string;
  /** xyz per vertex, model space (Skyrim units, Z up). */
  positions: Float32Array;
  /** xyz per vertex, unit length, model space. Null when the mesh has none. */
  normals: Float32Array | null;
  /** uv per vertex. Null when the mesh has none. */
  uvs: Float32Array | null;
  /** Triangle list (3 indices per triangle). */
  indices: Uint32Array;
  /** Data-relative diffuse texture path ("textures/..."), lower-case. */
  diffuseTexture: string | null;
  /** NiAlphaProperty alpha test enabled (cut-out textures such as fur or straps). */
  alphaTest: boolean;
  /** Alpha test threshold, 0..1. */
  alphaThreshold: number;
  /** NiAlphaProperty blending: see-through surfaces such as potion glass. */
  alphaBlend: boolean;
}

/**
 * BSInvMarker: the game's own inventory preview framing for this model.
 * Rotations are radians (the file stores thousandths of a radian).
 */
export interface NifInvMarker {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoom: number;
}

export interface NifBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface NifModel {
  meshes: NifMesh[];
  invMarker: NifInvMarker | null;
  bounds: NifBounds | null;
  /** Block types that were present but not understood (diagnostics only). */
  skippedBlockTypes: string[];
}
