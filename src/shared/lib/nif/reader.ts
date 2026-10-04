/**
 * Little-endian binary cursor over a NIF file.
 * Every read throws a RangeError (from DataView) when it runs past the end,
 * so a truncated or unexpected block aborts that block cleanly.
 */
export class BinaryReader {
  readonly view: DataView;
  offset: number;

  constructor(
    readonly bytes: Uint8Array,
    offset = 0,
  ) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.offset = offset;
  }

  u8(): number {
    const v = this.view.getUint8(this.offset);
    this.offset += 1;
    return v;
  }

  u16(): number {
    const v = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return v;
  }

  u32(): number {
    const v = this.view.getUint32(this.offset, true);
    this.offset += 4;
    return v;
  }

  i32(): number {
    const v = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return v;
  }

  f32(): number {
    const v = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return v;
  }

  f16(): number {
    const v = halfToFloat(this.view.getUint16(this.offset, true));
    this.offset += 2;
    return v;
  }

  skip(count: number): void {
    if (count < 0 || this.offset + count > this.bytes.byteLength) {
      throw new RangeError(`NIF: skip(${count}) past end at ${this.offset}`);
    }
    this.offset += count;
  }

  /** String prefixed by a u32 length (NIF "SizedString"). */
  sizedString(): string {
    const length = this.u32();
    return this.chars(length);
  }

  /** String prefixed by a u8 length, null terminator included (NIF "ExportString"). */
  shortString(): string {
    const length = this.u8();
    return this.chars(length).replace(/\0+$/, '');
  }

  /** Line terminated by '\n' (the NIF header line). */
  line(maxLength = 128): string {
    const start = this.offset;
    const end = Math.min(this.bytes.byteLength, start + maxLength);
    for (let i = start; i < end; i++) {
      if (this.bytes[i] === 0x0a) {
        this.offset = i + 1;
        return latin1(this.bytes.subarray(start, i));
      }
    }
    throw new Error('NIF: header line not terminated');
  }

  private chars(length: number): string {
    if (length > this.bytes.byteLength - this.offset) {
      throw new RangeError(`NIF: string length ${length} past end at ${this.offset}`);
    }
    const text = latin1(this.bytes.subarray(this.offset, this.offset + length));
    this.offset += length;
    return text;
  }
}

function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/** IEEE 754 half-precision → float. */
export function halfToFloat(h: number): number {
  const sign = h & 0x8000 ? -1 : 1;
  const exponent = (h >> 10) & 0x1f;
  const fraction = h & 0x03ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 0x1f) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}
