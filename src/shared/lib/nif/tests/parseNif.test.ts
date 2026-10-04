import { describe, it, expect } from 'vitest';
import { parseNif, normalizeTexturePath, NifParseError } from '../parseNif';
import { avObject, buildNif, ByteWriter, type TestBlock } from './nifBuilder';

const HALF_ONE = 0x3c00;

/** Root node (translated + scaled) → one textured BSTriShape triangle. */
function buildTriangleNif(opts: { hidden?: boolean; textureSetRef?: number } = {}): Uint8Array {
  // Block indices: 0 root, 1 inv marker, 2 shape, 3 shader, 4 texture set
  const root = avObject(new ByteWriter(), { name: 0, extra: [1], t: [10, 0, 0], scale: 2 });
  root.u32(1).i32(2); // children
  root.u32(0); // effects

  const invMarker = new ByteWriter().u32(0xffffffff).u16(1570).u16(0).u16(785).f32(1.5);

  const shape = avObject(new ByteWriter(), { name: 1, flags: opts.hidden ? 0x8000f : 0x8000e });
  shape.f32(0).f32(0).f32(0).f32(1); // bounding sphere
  shape.i32(-1).i32(3).i32(-1); // skin, shader, alpha
  // Vertex desc: 20-byte vertices, UV at byte 16; flags VERTEX | UV.
  shape.u32(0x5 | (0x4 << 8)).u32(0x3 << 12);
  shape.u16(1).u16(3).u32(60); // triangles, vertices, data size
  const verts: Array<[number, number, number, number, number]> = [
    [0, 0, 0, 0, 0],
    [1, 0, 0, HALF_ONE, 0],
    [0, 0, 1, 0, HALF_ONE],
  ];
  for (const [x, y, z, u, v] of verts) shape.f32(x).f32(y).f32(z).f32(0).u16(u).u16(v);
  shape.u16(0).u16(1).u16(2);

  const shader = new ByteWriter().u32(0); // Skyrim shader type
  shader.u32(0xffffffff).u32(0).i32(-1); // NiObjectNET
  shader.u32(0).u32(0).f32(0).f32(0).f32(1).f32(1).i32(opts.textureSetRef ?? 4);

  const textureSet = new ByteWriter().u32(2).sized('Textures\\Weapons\\Test\\Blade.dds').sized('');

  const blocks: TestBlock[] = [
    { type: 'BSFadeNode', data: root },
    { type: 'BSInvMarker', data: invMarker },
    { type: 'BSTriShape', data: shape },
    { type: 'BSLightingShaderProperty', data: shader },
    { type: 'BSShaderTextureSet', data: textureSet },
  ];
  return buildNif(blocks, ['Root', 'Blade']);
}

describe('parseNif', () => {
  it('reads a BSTriShape with node transform, UVs and diffuse texture', () => {
    const model = parseNif(buildTriangleNif());

    expect(model.meshes).toHaveLength(1);
    const mesh = model.meshes[0];
    expect(mesh.name).toBe('Blade');
    // Root translation (10,0,0) and scale 2 applied.
    expect(Array.from(mesh.positions)).toEqual([10, 0, 0, 12, 0, 0, 10, 0, 2]);
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2]);
    expect(Array.from(mesh.uvs ?? [])).toEqual([0, 0, 1, 0, 0, 1]);
    expect(mesh.diffuseTexture).toBe('textures/weapons/test/blade.dds');
    expect(model.bounds).toEqual({ min: [10, 0, 0], max: [12, 0, 2] });
  });

  it('reads the BSInvMarker framing in radians', () => {
    const model = parseNif(buildTriangleNif());
    expect(model.invMarker).toEqual({ rotationX: 1.57, rotationY: 0, rotationZ: 0.785, zoom: 1.5 });
  });

  it('skips hidden shapes', () => {
    const model = parseNif(buildTriangleNif({ hidden: true }));
    expect(model.meshes).toHaveLength(0);
    expect(model.bounds).toBeNull();
  });

  it('rejects files that are not NIFs', () => {
    const bytes = new TextEncoder().encode('DDS |not a model\n');
    expect(() => parseNif(bytes)).toThrow(NifParseError);
  });

  it('keeps the geometry when the texture reference is invalid', () => {
    const model = parseNif(buildTriangleNif({ textureSetRef: 1 }));
    expect(model.meshes).toHaveLength(1);
    expect(model.meshes[0].diffuseTexture).toBeNull();
  });

  it('rejects a block table larger than the file', () => {
    const bytes = buildTriangleNif();
    expect(() => parseNif(bytes.slice(0, bytes.length - 4))).toThrow(NifParseError);
  });
});

describe('normalizeTexturePath', () => {
  it('lower-cases, uses forward slashes and adds the textures/ prefix', () => {
    expect(normalizeTexturePath('Armor\\Iron\\Cuirass.dds')).toBe('textures/armor/iron/cuirass.dds');
    expect(normalizeTexturePath('textures\\a.dds')).toBe('textures/a.dds');
    expect(normalizeTexturePath('C:\\Games\\Skyrim\\Data\\Textures\\b.dds')).toBe('textures/b.dds');
  });

  it('returns null for empty paths', () => {
    expect(normalizeTexturePath('')).toBeNull();
    expect(normalizeTexturePath('\0')).toBeNull();
  });
});
