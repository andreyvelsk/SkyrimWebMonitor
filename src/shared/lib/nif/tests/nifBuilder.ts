/**
 * Tiny NIF writer for tests: produces a valid Skyrim SE (20.2.0.7 / BS 100)
 * file from a list of pre-encoded blocks.
 */
export class ByteWriter {
  private bytes: number[] = [];

  u8(v: number): this {
    this.bytes.push(v & 0xff);
    return this;
  }

  u16(v: number): this {
    return this.u8(v).u8(v >> 8);
  }

  u32(v: number): this {
    return this.u16(v & 0xffff).u16((v >>> 16) & 0xffff);
  }

  i32(v: number): this {
    return this.u32(v >>> 0);
  }

  f32(v: number): this {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, v, true);
    for (let i = 0; i < 4; i++) this.u8(view.getUint8(i));
    return this;
  }

  chars(text: string): this {
    for (const ch of text) this.u8(ch.charCodeAt(0));
    return this;
  }

  sized(text: string): this {
    return this.u32(text.length).chars(text);
  }

  short(text: string): this {
    return this.u8(text.length + 1).chars(text).u8(0);
  }

  append(other: ByteWriter): this {
    this.bytes.push(...other.toArray());
    return this;
  }

  toArray(): number[] {
    return this.bytes;
  }

  toBytes(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

export interface TestBlock {
  type: string;
  data: ByteWriter;
}

export function buildNif(blocks: TestBlock[], strings: string[], bsVersion = 100): Uint8Array {
  const types = [...new Set(blocks.map((b) => b.type))];
  const w = new ByteWriter();
  w.chars('Gamebryo File Format, Version 20.2.0.7\n');
  w.u32(0x14020007).u8(1).u32(12).u32(blocks.length);
  w.u32(bsVersion).short('test').short('').short('');
  w.u16(types.length);
  for (const t of types) w.sized(t);
  for (const b of blocks) w.u16(types.indexOf(b.type));
  for (const b of blocks) w.u32(b.data.toArray().length);
  w.u32(strings.length).u32(Math.max(0, ...strings.map((s) => s.length)));
  for (const s of strings) w.sized(s);
  w.u32(0); // groups
  for (const b of blocks) w.append(b.data);
  return w.toBytes();
}

/** NiObjectNET + NiAVObject prefix. */
export function avObject(
  w: ByteWriter,
  opts: { name: number; extra?: number[]; flags?: number; t?: [number, number, number]; scale?: number },
): ByteWriter {
  const extra = opts.extra ?? [];
  w.u32(opts.name).u32(extra.length);
  for (const e of extra) w.i32(e);
  w.i32(-1); // controller
  w.u32(opts.flags ?? 0x8000e);
  const t = opts.t ?? [0, 0, 0];
  w.f32(t[0]).f32(t[1]).f32(t[2]);
  for (const v of [1, 0, 0, 0, 1, 0, 0, 0, 1]) w.f32(v);
  w.f32(opts.scale ?? 1);
  w.i32(-1); // collision
  return w;
}
