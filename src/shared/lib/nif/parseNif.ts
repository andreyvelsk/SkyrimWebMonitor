/**
 * Minimal NIF reader for Skyrim LE (BS version 83) and Skyrim SE (BS 100)
 * meshes. It extracts only what a static thumbnail needs: triangle geometry
 * in model space, normals, UVs, the diffuse texture path, alpha testing and
 * the BSInvMarker inventory framing. Everything else (collision, skinning
 * weights, animation, effects) is skipped using the header's block sizes, so
 * unknown blocks never break parsing.
 *
 * Layouts follow niftools' nif.xml; the SSE skin-partition tail was verified
 * against vanilla SSE meshes.
 */
import { BinaryReader } from './reader';
import type { NifBounds, NifInvMarker, NifMesh, NifModel } from './types';

const NIF_VERSION_20_2_0_7 = 0x14020007;
const NO_REF = -1;
const NO_STRING = 0xffffffff;

const NODE_TYPES = new Set([
  'NiNode',
  'BSFadeNode',
  'BSLeafAnimNode',
  'BSMultiBoundNode',
  'BSOrderedNode',
  'BSValueNode',
  'BSTreeNode',
  'NiBillboardNode',
  'NiSwitchNode',
  'NiLODNode',
  'BSMasterParticleSystem',
]);

/** BSTriShape family: same prefix; vertex data is inline (or in the skin partition). */
const BS_TRI_SHAPE_TYPES = new Set([
  'BSTriShape',
  'BSMeshLODTriShape',
  'BSSubIndexTriShape',
  'BSDynamicTriShape',
]);
const NI_GEOMETRY_TYPES = new Set(['NiTriShape', 'NiTriStrips']);

// BSVertexDesc attribute flags (bits 44+ of the 64-bit descriptor).
const VA_VERTEX = 0x001;
const VA_UV = 0x002;
const VA_NORMAL = 0x008;
const VA_FULL_PRECISION = 0x400;

// NiAVObject flag: hidden.
const AV_FLAG_HIDDEN = 0x1;
// NiAlphaProperty flags.
const ALPHA_FLAG_BLEND = 1;
const ALPHA_FLAG_TEST = 1 << 9;
// NiGeometryData BS vector flags.
const BS_VF_HAS_UV = 0x1;
const BS_VF_HAS_TANGENTS = 0x1000;

interface Header {
  bsVersion: number;
  blockTypes: string[];
  blockOffsets: number[];
  blockSizes: number[];
  strings: string[];
}

/** Rotation (row-major 3×3), translation, uniform scale. */
interface Transform {
  r: number[];
  t: [number, number, number];
  s: number;
}

const IDENTITY: Transform = { r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0], s: 1 };

interface AvObject {
  name: string;
  extraData: number[];
  flags: number;
  transform: Transform;
}

interface ShaderInfo {
  diffuseTexture: string | null;
  isEffectShader: boolean;
}

interface VertexDesc {
  vertexSize: number;
  uvOffset: number;
  normalOffset: number;
  flags: number;
}

export class NifParseError extends Error {}

export function parseNif(bytes: Uint8Array): NifModel {
  const header = readHeader(bytes);
  const meshes: NifMesh[] = [];
  const skipped = new Set<string>();
  const visited = new Set<number>();

  let invMarker: NifInvMarker | null = null;

  const walk = (blockIndex: number, parent: Transform): void => {
    if (blockIndex === NO_REF || visited.has(blockIndex)) return;
    if (blockIndex < 0 || blockIndex >= header.blockTypes.length) return;
    visited.add(blockIndex);

    const type = header.blockTypes[blockIndex];
    try {
      if (NODE_TYPES.has(type)) {
        const r = blockReader(bytes, header, blockIndex);
        const av = readAvObject(r, header);
        if (!invMarker) invMarker = findInvMarker(bytes, header, av.extraData);
        if (av.flags & AV_FLAG_HIDDEN) return;
        const world = compose(parent, av.transform);
        const childCount = r.u32();
        const children: number[] = [];
        for (let i = 0; i < childCount; i++) children.push(r.i32());
        for (const child of children) walk(child, world);
        return;
      }

      if (BS_TRI_SHAPE_TYPES.has(type)) {
        const mesh = readBsTriShape(bytes, header, blockIndex, parent);
        if (mesh) meshes.push(mesh);
        return;
      }

      if (NI_GEOMETRY_TYPES.has(type)) {
        const mesh = readNiGeometry(bytes, header, blockIndex, parent);
        if (mesh) meshes.push(mesh);
        return;
      }

      skipped.add(type);
    } catch (err) {
      // One malformed or unexpected block must not lose the whole model.
      skipped.add(`${type} (error: ${err instanceof Error ? err.message : String(err)})`);
    }
  };

  walk(0, IDENTITY);

  return {
    meshes,
    invMarker,
    bounds: computeBounds(meshes),
    skippedBlockTypes: [...skipped],
  };
}

// ─── Header ──────────────────────────────────────────────────────────────

function readHeader(bytes: Uint8Array): Header {
  const r = new BinaryReader(bytes);
  const line = r.line();
  if (!line.startsWith('Gamebryo File Format')) {
    throw new NifParseError(`Not a NIF file ("${line.slice(0, 40)}")`);
  }

  const version = r.u32();
  if (version !== NIF_VERSION_20_2_0_7) {
    throw new NifParseError(`Unsupported NIF version 0x${version.toString(16)}`);
  }
  r.u8(); // endian
  const userVersion = r.u32();
  const blockCount = r.u32();
  if (userVersion < 10) throw new NifParseError(`Unsupported user version ${userVersion}`);

  const bsVersion = r.u32();
  r.shortString(); // author
  if (bsVersion > 130) r.u32();
  r.shortString(); // process script
  r.shortString(); // export script
  if (bsVersion >= 103) r.shortString(); // max filepath

  const typeCount = r.u16();
  const typeNames: string[] = [];
  for (let i = 0; i < typeCount; i++) typeNames.push(r.sizedString());

  const blockTypes: string[] = [];
  for (let i = 0; i < blockCount; i++) blockTypes.push(typeNames[r.u16() & 0x7fff] ?? 'Unknown');

  const blockSizes: number[] = [];
  for (let i = 0; i < blockCount; i++) blockSizes.push(r.u32());

  const stringCount = r.u32();
  r.u32(); // max string length
  const strings: string[] = [];
  for (let i = 0; i < stringCount; i++) strings.push(r.sizedString());

  const groupCount = r.u32();
  r.skip(groupCount * 4);

  const blockOffsets: number[] = [];
  let offset = r.offset;
  for (const size of blockSizes) {
    blockOffsets.push(offset);
    offset += size;
  }
  if (offset > bytes.byteLength) throw new NifParseError('NIF block table exceeds file size');

  return { bsVersion, blockTypes, blockOffsets, blockSizes, strings };
}

function blockReader(bytes: Uint8Array, header: Header, index: number): BinaryReader {
  const start = header.blockOffsets[index];
  const size = header.blockSizes[index];
  // Bound the reader to the block so overruns fail inside this block only.
  return new BinaryReader(bytes.subarray(start, start + size));
}

function typeOf(header: Header, ref: number): string | null {
  if (ref === NO_REF || ref < 0 || ref >= header.blockTypes.length) return null;
  return header.blockTypes[ref];
}

function stringAt(header: Header, index: number): string {
  if (index === NO_STRING) return '';
  return header.strings[index] ?? '';
}

// ─── Common object prefixes ──────────────────────────────────────────────

function readObjectNet(r: BinaryReader, header: Header): { name: string; extraData: number[] } {
  const name = stringAt(header, r.u32());
  const extraCount = r.u32();
  const extraData: number[] = [];
  for (let i = 0; i < extraCount; i++) extraData.push(r.i32());
  r.i32(); // controller
  return { name, extraData };
}

function readAvObject(r: BinaryReader, header: Header): AvObject {
  const { name, extraData } = readObjectNet(r, header);
  const flags = header.bsVersion > 26 ? r.u32() : r.u16();
  const t: [number, number, number] = [r.f32(), r.f32(), r.f32()];
  const rot: number[] = [];
  for (let i = 0; i < 9; i++) rot.push(r.f32());
  const s = r.f32();
  if (header.bsVersion <= 34) {
    const propertyCount = r.u32();
    r.skip(propertyCount * 4);
  }
  r.i32(); // collision object
  return { name, extraData, flags, transform: { r: rot, t, s } };
}

function findInvMarker(bytes: Uint8Array, header: Header, extraData: number[]): NifInvMarker | null {
  for (const ref of extraData) {
    if (typeOf(header, ref) !== 'BSInvMarker') continue;
    const r = blockReader(bytes, header, ref);
    r.u32(); // name
    return {
      rotationX: r.u16() / 1000,
      rotationY: r.u16() / 1000,
      rotationZ: r.u16() / 1000,
      zoom: r.f32(),
    };
  }
  return null;
}

// ─── Properties ──────────────────────────────────────────────────────────

function readShader(bytes: Uint8Array, header: Header, ref: number): ShaderInfo {
  const type = typeOf(header, ref);
  if (type === 'BSEffectShaderProperty') return { diffuseTexture: null, isEffectShader: true };
  if (type !== 'BSLightingShaderProperty') return { diffuseTexture: null, isEffectShader: false };

  const r = blockReader(bytes, header, ref);
  if (header.bsVersion <= 130) r.u32(); // Skyrim shader type (precedes NiObjectNET)
  readObjectNet(r, header);
  r.u32(); // shader flags 1
  r.u32(); // shader flags 2
  r.skip(16); // UV offset + UV scale
  const textureSetRef = r.i32();

  if (typeOf(header, textureSetRef) !== 'BSShaderTextureSet') {
    return { diffuseTexture: null, isEffectShader: false };
  }
  const tr = blockReader(bytes, header, textureSetRef);
  const count = tr.u32();
  const diffuse = count > 0 ? tr.sizedString() : '';
  return { diffuseTexture: normalizeTexturePath(diffuse), isEffectShader: false };
}

interface AlphaInfo {
  test: boolean;
  threshold: number;
  blend: boolean;
}

function readAlpha(bytes: Uint8Array, header: Header, ref: number): AlphaInfo {
  if (typeOf(header, ref) !== 'NiAlphaProperty') return { test: false, threshold: 0, blend: false };
  const r = blockReader(bytes, header, ref);
  readObjectNet(r, header);
  const flags = r.u16();
  const threshold = r.u8();
  return { test: (flags & ALPHA_FLAG_TEST) !== 0, threshold: threshold / 255, blend: (flags & ALPHA_FLAG_BLEND) !== 0 };
}

export function normalizeTexturePath(path: string): string | null {
  let p = path.replace(/\0+$/, '').trim().replace(/\\/g, '/').toLowerCase();
  if (!p) return null;
  p = p.replace(/^\/+/, '');
  const dataIndex = p.indexOf('data/textures/');
  if (dataIndex >= 0) p = p.slice(dataIndex + 5);
  if (!p.startsWith('textures/')) p = `textures/${p}`;
  return p;
}

// ─── BSTriShape (SSE) ────────────────────────────────────────────────────

function readVertexDesc(r: BinaryReader): VertexDesc {
  const lo = r.u32();
  const hi = r.u32();
  return {
    vertexSize: (lo & 0xf) * 4,
    uvOffset: ((lo >>> 8) & 0xf) * 4,
    normalOffset: ((lo >>> 16) & 0xf) * 4,
    flags: hi >>> 12, // bits 44..63
  };
}

interface VertexArrays {
  positions: Float32Array;
  normals: Float32Array | null;
  uvs: Float32Array | null;
}

function decodeVertices(
  r: BinaryReader,
  count: number,
  desc: VertexDesc,
  bsVersion: number,
): VertexArrays {
  const hasUv = (desc.flags & VA_UV) !== 0;
  const hasNormal = (desc.flags & VA_NORMAL) !== 0;
  // SSE vertex data is always full precision; FO4 packs halves unless flagged.
  const halfPositions = bsVersion >= 130 && (desc.flags & VA_FULL_PRECISION) === 0;

  const positions = new Float32Array(count * 3);
  const normals = hasNormal ? new Float32Array(count * 3) : null;
  const uvs = hasUv ? new Float32Array(count * 2) : null;
  const base = r.offset;

  for (let i = 0; i < count; i++) {
    const v = base + i * desc.vertexSize;
    if (desc.flags & VA_VERTEX) {
      r.offset = v;
      if (halfPositions) {
        positions[i * 3] = r.f16();
        positions[i * 3 + 1] = r.f16();
        positions[i * 3 + 2] = r.f16();
      } else {
        positions[i * 3] = r.f32();
        positions[i * 3 + 1] = r.f32();
        positions[i * 3 + 2] = r.f32();
      }
    }
    if (uvs) {
      r.offset = v + desc.uvOffset;
      uvs[i * 2] = r.f16();
      uvs[i * 2 + 1] = r.f16();
    }
    if (normals) {
      r.offset = v + desc.normalOffset;
      normals[i * 3] = (r.u8() / 255) * 2 - 1;
      normals[i * 3 + 1] = (r.u8() / 255) * 2 - 1;
      normals[i * 3 + 2] = (r.u8() / 255) * 2 - 1;
    }
  }
  r.offset = base + count * desc.vertexSize;
  return { positions, normals, uvs };
}

function readBsTriShape(
  bytes: Uint8Array,
  header: Header,
  index: number,
  parent: Transform,
): NifMesh | null {
  const r = blockReader(bytes, header, index);
  const av = readAvObject(r, header);
  if (av.flags & AV_FLAG_HIDDEN) return null;

  r.skip(16); // bounding sphere
  const skinRef = r.i32();
  const shaderRef = r.i32();
  const alphaRef = r.i32();
  const desc = readVertexDesc(r);
  const triangleCount = header.bsVersion >= 130 ? r.u32() : r.u16();
  const vertexCount = r.u16();
  const dataSize = r.u32();

  let arrays: VertexArrays | null = null;
  let indices: Uint32Array | null = null;

  const hasInlineData = dataSize > 0 && vertexCount > 0;
  if (hasInlineData) {
    arrays = decodeVertices(r, vertexCount, desc, header.bsVersion);
    indices = new Uint32Array(triangleCount * 3);
    for (let i = 0; i < indices.length; i++) indices[i] = r.u16();
  }

  // BSDynamicTriShape: positions are in a trailing Vector4 array (xyz + bitangent x).
  let dynamicPositions: Float32Array | null = null;
  if (header.blockTypes[index] === 'BSDynamicTriShape') {
    if (header.bsVersion === 100) {
      const particleDataSize = r.u32();
      if (particleDataSize > 0) return null; // not used by item meshes
    }
    const dynamicCount = r.u32() / 16;
    if (dynamicCount === vertexCount) {
      const dynamic = new Float32Array(vertexCount * 3);
      let anyNonZero = false;
      for (let i = 0; i < vertexCount; i++) {
        for (let axis = 0; axis < 3; axis++) {
          const v = r.f32();
          dynamic[i * 3 + axis] = v;
          if (v !== 0) anyNonZero = true;
        }
        r.f32();
      }
      // Some files leave the dynamic array zeroed; keep the static positions then.
      if (anyNonZero) dynamicPositions = dynamic;
    }
  }

  if (!hasInlineData && skinRef !== NO_REF) {
    // SSE skinned shapes keep their vertices in the NiSkinPartition.
    const fromSkin = readSkinPartitionGeometry(bytes, header, skinRef);
    if (fromSkin) {
      arrays = fromSkin.arrays;
      indices = fromSkin.indices;
    }
  }

  if (arrays && dynamicPositions && dynamicPositions.length === arrays.positions.length) {
    arrays.positions.set(dynamicPositions);
  }

  if (!arrays || !indices || indices.length === 0) return null;

  const shader = readShader(bytes, header, shaderRef);
  if (shader.isEffectShader) return null; // glows / decals: not part of the item silhouette
  const alpha = readAlpha(bytes, header, alphaRef);

  return finalizeMesh(av, parent, arrays, indices, shader, alpha);
}

function readSkinPartitionGeometry(
  bytes: Uint8Array,
  header: Header,
  skinRef: number,
): { arrays: VertexArrays; indices: Uint32Array } | null {
  const skinType = typeOf(header, skinRef);
  if (skinType !== 'NiSkinInstance' && skinType !== 'BSDismemberSkinInstance') return null;

  const sr = blockReader(bytes, header, skinRef);
  sr.i32(); // skin data
  const partitionRef = sr.i32();
  if (typeOf(header, partitionRef) !== 'NiSkinPartition') return null;
  if (header.bsVersion !== 100) return null; // only SSE stores shared vertex data here

  const r = blockReader(bytes, header, partitionRef);
  const partitionCount = r.u32();
  const dataSize = r.u32();
  const vertexSize = r.u32();
  const desc = readVertexDesc(r);
  if (vertexSize === 0 || desc.vertexSize !== vertexSize) return null;

  const vertexCount = Math.floor(dataSize / vertexSize);
  const arrays = decodeVertices(r, vertexCount, desc, header.bsVersion);

  const triangles: number[] = [];
  for (let p = 0; p < partitionCount; p++) {
    const numVertices = r.u16();
    const numTriangles = r.u16();
    const numBones = r.u16();
    const numStrips = r.u16();
    const weightsPerVertex = r.u16();
    r.skip(numBones * 2);
    if (r.u8()) r.skip(numVertices * 2); // vertex map
    if (r.u8()) r.skip(numVertices * weightsPerVertex * 4); // weights
    let stripTotal = 0;
    for (let i = 0; i < numStrips; i++) stripTotal += r.u16();
    if (r.u8()) r.skip(numStrips > 0 ? stripTotal * 2 : numTriangles * 6); // local faces
    if (r.u8()) r.skip(numVertices * weightsPerVertex); // bone indices
    r.skip(2); // LOD level + global VB flag
    r.skip(8); // partition vertex desc
    // "Triangles Copy": the same faces, indexed into the shared vertex data.
    for (let i = 0; i < numTriangles * 3; i++) triangles.push(r.u16());
  }

  const indices = Uint32Array.from(triangles.filter((i) => i < vertexCount));
  if (indices.length !== triangles.length) return null;
  return { arrays, indices };
}

// ─── NiTriShape / NiTriStrips (LE-style geometry) ────────────────────────

function readNiGeometry(
  bytes: Uint8Array,
  header: Header,
  index: number,
  parent: Transform,
): NifMesh | null {
  const r = blockReader(bytes, header, index);
  const av = readAvObject(r, header);
  if (av.flags & AV_FLAG_HIDDEN) return null;

  const dataRef = r.i32();
  r.i32(); // skin instance
  const materialCount = r.u32();
  r.skip(materialCount * 8); // names + extra data
  r.i32(); // active material
  r.u8(); // material needs update
  const shaderRef = r.i32();
  const alphaRef = r.i32();

  const dataType = typeOf(header, dataRef);
  if (dataType !== 'NiTriShapeData' && dataType !== 'NiTriStripsData') return null;

  const geometry = readNiGeometryData(bytes, header, dataRef, dataType);
  if (!geometry || geometry.indices.length === 0) return null;

  const shader = readShader(bytes, header, shaderRef);
  if (shader.isEffectShader) return null;
  const alpha = readAlpha(bytes, header, alphaRef);

  return finalizeMesh(av, parent, geometry.arrays, geometry.indices, shader, alpha);
}

function readNiGeometryData(
  bytes: Uint8Array,
  header: Header,
  ref: number,
  dataType: string,
): { arrays: VertexArrays; indices: Uint32Array } | null {
  const r = blockReader(bytes, header, ref);
  r.i32(); // group id
  const vertexCount = r.u16();
  r.u8(); // keep flags
  r.u8(); // compress flags
  const hasVertices = r.u8() !== 0;
  if (!hasVertices || vertexCount === 0) return null;

  const positions = new Float32Array(vertexCount * 3);
  for (let i = 0; i < positions.length; i++) positions[i] = r.f32();

  const bsVectorFlags = r.u16();
  if (header.bsVersion > 34) r.u32(); // material CRC

  let normals: Float32Array | null = null;
  if (r.u8()) {
    normals = new Float32Array(vertexCount * 3);
    for (let i = 0; i < normals.length; i++) normals[i] = r.f32();
    if (bsVectorFlags & BS_VF_HAS_TANGENTS) r.skip(vertexCount * 24); // tangents + bitangents
  }

  r.skip(16); // bounding sphere
  if (r.u8()) r.skip(vertexCount * 16); // vertex colours

  let uvs: Float32Array | null = null;
  if (bsVectorFlags & BS_VF_HAS_UV) {
    uvs = new Float32Array(vertexCount * 2);
    for (let i = 0; i < uvs.length; i++) uvs[i] = r.f32();
  }

  r.u16(); // consistency flags
  r.i32(); // additional data
  const triangleCount = r.u16();

  let indices: Uint32Array;
  if (dataType === 'NiTriShapeData') {
    r.u32(); // number of triangle points
    const hasTriangles = r.u8() !== 0;
    indices = new Uint32Array(hasTriangles ? triangleCount * 3 : 0);
    for (let i = 0; i < indices.length; i++) indices[i] = r.u16();
  } else {
    const stripCount = r.u16();
    const lengths: number[] = [];
    for (let i = 0; i < stripCount; i++) lengths.push(r.u16());
    const hasPoints = r.u8() !== 0;
    const out: number[] = [];
    if (hasPoints) {
      for (const length of lengths) {
        const strip: number[] = [];
        for (let i = 0; i < length; i++) strip.push(r.u16());
        for (let i = 2; i < strip.length; i++) {
          const a = strip[i - 2];
          const b = strip[i - 1];
          const c = strip[i];
          if (a === b || b === c || a === c) continue; // degenerate
          if (i % 2 === 0) out.push(a, b, c);
          else out.push(a, c, b);
        }
      }
    }
    indices = Uint32Array.from(out);
  }

  for (const i of indices) if (i >= vertexCount) return null;
  return { arrays: { positions, normals, uvs }, indices };
}

// ─── Transforms & output ─────────────────────────────────────────────────

function compose(parent: Transform, local: Transform): Transform {
  const r = mul3(parent.r, local.r);
  const lt = apply3(parent.r, local.t);
  return {
    r,
    t: [
      lt[0] * parent.s + parent.t[0],
      lt[1] * parent.s + parent.t[1],
      lt[2] * parent.s + parent.t[2],
    ],
    s: parent.s * local.s,
  };
}

function mul3(a: number[], b: number[]): number[] {
  const out = new Array<number>(9);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      out[row * 3 + col] =
        a[row * 3] * b[col] + a[row * 3 + 1] * b[3 + col] + a[row * 3 + 2] * b[6 + col];
    }
  }
  return out;
}

function apply3(m: number[], v: readonly number[]): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

function finalizeMesh(
  av: AvObject,
  parent: Transform,
  arrays: VertexArrays,
  indices: Uint32Array,
  shader: ShaderInfo,
  alpha: AlphaInfo,
): NifMesh {
  const world = compose(parent, av.transform);
  const { positions, normals } = arrays;

  for (let i = 0; i < positions.length; i += 3) {
    const p = apply3(world.r, [positions[i], positions[i + 1], positions[i + 2]]);
    positions[i] = p[0] * world.s + world.t[0];
    positions[i + 1] = p[1] * world.s + world.t[1];
    positions[i + 2] = p[2] * world.s + world.t[2];
  }

  if (normals) {
    for (let i = 0; i < normals.length; i += 3) {
      const n = apply3(world.r, [normals[i], normals[i + 1], normals[i + 2]]);
      const length = Math.hypot(n[0], n[1], n[2]) || 1;
      normals[i] = n[0] / length;
      normals[i + 1] = n[1] / length;
      normals[i + 2] = n[2] / length;
    }
  }

  return {
    name: av.name,
    positions,
    normals,
    uvs: arrays.uvs,
    indices,
    diffuseTexture: shader.diffuseTexture,
    alphaTest: alpha.test,
    alphaThreshold: alpha.threshold,
    alphaBlend: alpha.blend,
  };
}

function computeBounds(meshes: NifMesh[]): NifBounds | null {
  if (meshes.length === 0) return null;
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const mesh of meshes) {
    const p = mesh.positions;
    for (let i = 0; i < p.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const v = p[i + axis];
        if (v < min[axis]) min[axis] = v;
        if (v > max[axis]) max[axis] = v;
      }
    }
  }
  return { min, max };
}
