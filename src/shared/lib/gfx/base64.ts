/**
 * Base64 decoding helpers for the GFX parser.
 *
 * Accepts a plain base64 string or a data URL. Works in both browser and
 * Node.js environments.
 */

/**
 * Decode a base64 string (optionally prefixed with a data URL) into bytes.
 */
export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
  const bin = atob(clean);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}
