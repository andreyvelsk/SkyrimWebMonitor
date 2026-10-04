/**
 * Renders a parsed NIF model into a small transparent thumbnail with WebGL 1.
 *
 * Look: Skyrim-inventory style framing (BSInvMarker when the model has one),
 * warm key light, cool fill and a rim light so dark metals still read on a
 * dark UI. Untextured meshes use the supplied tint (material colour).
 *
 * One shared GL context is reused for every thumbnail: mobile browsers cap
 * the number of live contexts, so creating one per item would fail quickly.
 */
import type { NifMesh, NifModel } from './types';

export type ThumbnailFraming = 'diagonal' | 'upright';

/** Decoded diffuse texture (any drawable image with pixel dimensions). */
export type ThumbnailTextureSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export interface ThumbnailOptions {
  /** Output edge length in CSS pixels. */
  size?: number;
  /** Render scale before downsampling (anti-aliasing). */
  supersample?: number;
  /** Base colour for untextured meshes, 0..1 RGB. */
  tint?: [number, number, number];
  /** Decoded diffuse textures by normalized path. */
  textures?: Map<string, ThumbnailTextureSource>;
  /** Fallback framing when the model has no BSInvMarker. */
  framing?: ThumbnailFraming;
  /** Output encoding. */
  mimeType?: 'image/webp' | 'image/png';
}

type Mat3 = number[];

const DEFAULT_TINT: [number, number, number] = [0.72, 0.7, 0.66];

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform vec3 uScale;
uniform vec3 uOffset;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vNormal = aNormal;
  vUv = aUv;
  // View space: x right, z up, y depth (camera looks along +y).
  vec3 p = aPosition * uScale + uOffset;
  gl_Position = vec4(p.x, p.z, p.y, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision mediump float;
varying vec3 vNormal;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform bool uHasTexture;
uniform vec3 uTint;
uniform float uAlphaCutoff;
// < 0: opaque. Otherwise the surface is alpha-blended (glass): texture alpha,
// or this value for untextured meshes.
uniform float uOpacity;
void main() {
  vec4 base = uHasTexture ? texture2D(uTexture, vUv) : vec4(uTint, 1.0);
  if (base.a < uAlphaCutoff) discard;

  vec3 n = normalize(vNormal);
  vec3 toCamera = vec3(0.0, -1.0, 0.0);
  // Two-sided lighting: winding is not consistent across item meshes, so
  // always light the side that faces the camera.
  if (dot(n, toCamera) < 0.0) n = -n;

  vec3 keyDir = normalize(vec3(-0.55, -0.7, 0.75));
  vec3 fillDir = normalize(vec3(0.8, -0.4, -0.2));
  float key = max(dot(n, keyDir), 0.0);
  float fill = max(dot(n, fillDir), 0.0);
  float rim = pow(1.0 - max(dot(n, toCamera), 0.0), 2.5);
  vec3 halfVec = normalize(keyDir + toCamera);
  float spec = pow(max(dot(n, halfVec), 0.0), 32.0);

  // Matte look: game textures already carry their own shading detail.
  vec3 color = base.rgb * (0.38 + 0.8 * key * vec3(1.0, 0.96, 0.9) + 0.25 * fill * vec3(0.8, 0.88, 1.0));
  color += spec * 0.08 * vec3(1.0, 0.97, 0.9);
  color += rim * 0.14 * vec3(0.85, 0.9, 1.0);
  float alpha = uOpacity < 0.0 ? 1.0 : (uHasTexture ? base.a : uOpacity);
  gl_FragColor = vec4(min(color, vec3(1.0)), alpha);
}
`;

interface GlState {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uintIndices: boolean;
  locations: {
    position: number;
    normal: number;
    uv: number;
    scale: WebGLUniformLocation | null;
    offset: WebGLUniformLocation | null;
    texture: WebGLUniformLocation | null;
    hasTexture: WebGLUniformLocation | null;
    tint: WebGLUniformLocation | null;
    alphaCutoff: WebGLUniformLocation | null;
    opacity: WebGLUniformLocation | null;
  };
}

let glState: GlState | null = null;

/** Opacity of untextured see-through meshes. */
const GLASS_OPACITY = 0.35;

export function isThumbnailRenderingSupported(): boolean {
  try {
    return getGl() !== null;
  } catch {
    return false;
  }
}

/**
 * The framing rotation a thumbnail uses (BSInvMarker, else a heuristic).
 * The interactive viewer starts from the same pose.
 */
export function modelOrientation(model: NifModel, framing: ThumbnailFraming = 'diagonal'): number[] {
  const meshes = model.meshes.filter((m) => m.indices.length > 0);
  return model.invMarker
    ? invMarkerRotation(model.invMarker.rotationX, model.invMarker.rotationY, model.invMarker.rotationZ)
    : heuristicRotation(meshes, framing);
}

/** Returns a data: URL, or null when the model has no drawable geometry. */
export function renderNifThumbnail(model: NifModel, options: ThumbnailOptions = {}): string | null {
  const meshes = model.meshes.filter((m) => m.indices.length > 0);
  if (meshes.length === 0) return null;

  const state = getGl();
  if (!state) return null;

  const size = options.size ?? 96;
  const supersample = options.supersample ?? 2;
  const renderSize = size * supersample;
  const { gl, canvas, locations } = state;

  const orientation = model.invMarker
    ? invMarkerRotation(model.invMarker.rotationX, model.invMarker.rotationY, model.invMarker.rotationZ)
    : heuristicRotation(meshes, options.framing ?? 'diagonal');

  // Fit: transform all vertices once to find the view-space bounds.
  const transformed = meshes.map((mesh) => transformMesh(mesh, orientation));
  const bounds = viewBounds(transformed.map((t) => t.positions));
  if (!bounds) return null;

  const width = bounds.max[0] - bounds.min[0];
  const height = bounds.max[2] - bounds.min[2];
  const depth = Math.max(bounds.max[1] - bounds.min[1], 1e-3);
  const extent = Math.max(width, height, 1e-3) * 1.04; // small padding: fill the box
  const scale = 2 / extent;
  const centerX = (bounds.min[0] + bounds.max[0]) / 2;
  const centerZ = (bounds.min[2] + bounds.max[2]) / 2;
  const centerY = (bounds.min[1] + bounds.max[1]) / 2;

  if (canvas.width !== renderSize || canvas.height !== renderSize) {
    canvas.width = renderSize;
    canvas.height = renderSize;
  }
  gl.viewport(0, 0, renderSize, renderSize);
  gl.clearColor(0, 0, 0, 0);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.CULL_FACE);
  gl.useProgram(state.program);

  // Depth maps view y into clip z in [-0.9, 0.9].
  gl.uniform3f(locations.scale, scale, 1.8 / depth, scale);
  gl.uniform3f(locations.offset, -centerX * scale, (-centerY * 1.8) / depth, -centerZ * scale);
  const tint = options.tint ?? DEFAULT_TINT;
  gl.uniform3f(locations.tint, tint[0], tint[1], tint[2]);
  gl.uniform1i(locations.texture, 0);

  const created: { buffers: WebGLBuffer[]; textures: WebGLTexture[] } = { buffers: [], textures: [] };
  const textureCache = new Map<string, WebGLTexture | null>();

  try {
    // Opaque first, then see-through surfaces (potion glass) over them.
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    for (const pass of [false, true]) {
      if (pass) {
        gl.enable(gl.BLEND);
        gl.depthMask(false);
      }
      transformed.forEach((geometry, i) => {
        const mesh = meshes[i];
        if (mesh.alphaBlend !== pass) return;
        gl.uniform1f(locations.opacity, pass ? GLASS_OPACITY : -1);
        drawMesh(state, mesh, geometry, options.textures, textureCache, created);
      });
    }
  } finally {
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    for (const b of created.buffers) gl.deleteBuffer(b);
    for (const t of created.textures) gl.deleteTexture(t);
  }

  return downsample(canvas, size, options.mimeType ?? 'image/webp');
}

// ─── GL setup ────────────────────────────────────────────────────────────

function getGl(): GlState | null {
  if (glState && !glState.gl.isContextLost()) return glState;
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const program = linkProgram(gl, VERTEX_SHADER, FRAGMENT_SHADER);
  if (!program) return null;

  glState = {
    canvas,
    gl,
    program,
    uintIndices: gl.getExtension('OES_element_index_uint') !== null,
    locations: {
      position: gl.getAttribLocation(program, 'aPosition'),
      normal: gl.getAttribLocation(program, 'aNormal'),
      uv: gl.getAttribLocation(program, 'aUv'),
      scale: gl.getUniformLocation(program, 'uScale'),
      offset: gl.getUniformLocation(program, 'uOffset'),
      texture: gl.getUniformLocation(program, 'uTexture'),
      hasTexture: gl.getUniformLocation(program, 'uHasTexture'),
      tint: gl.getUniformLocation(program, 'uTint'),
      alphaCutoff: gl.getUniformLocation(program, 'uAlphaCutoff'),
      opacity: gl.getUniformLocation(program, 'uOpacity'),
    },
  };
  return glState;
}

function linkProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const compile = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('[NifThumbnail] shader error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, v);
  gl.attachShader(program, f);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[NifThumbnail] link error:', gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

// ─── Geometry ────────────────────────────────────────────────────────────

interface TransformedGeometry {
  positions: Float32Array;
  normals: Float32Array;
}

function transformMesh(mesh: NifMesh, m: Mat3): TransformedGeometry {
  const src = mesh.positions;
  const positions = new Float32Array(src.length);
  for (let i = 0; i < src.length; i += 3) {
    const x = src[i];
    const y = src[i + 1];
    const z = src[i + 2];
    positions[i] = m[0] * x + m[1] * y + m[2] * z;
    positions[i + 1] = m[3] * x + m[4] * y + m[5] * z;
    positions[i + 2] = m[6] * x + m[7] * y + m[8] * z;
  }

  let normals: Float32Array;
  if (mesh.normals) {
    const n = mesh.normals;
    normals = new Float32Array(n.length);
    for (let i = 0; i < n.length; i += 3) {
      normals[i] = m[0] * n[i] + m[1] * n[i + 1] + m[2] * n[i + 2];
      normals[i + 1] = m[3] * n[i] + m[4] * n[i + 1] + m[5] * n[i + 2];
      normals[i + 2] = m[6] * n[i] + m[7] * n[i + 1] + m[8] * n[i + 2];
    }
  } else {
    normals = computeNormals(positions, mesh.indices);
  }
  return { positions, normals };
}

export function computeNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const normals = new Float32Array(positions.length);
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3;
    const b = indices[i + 1] * 3;
    const c = indices[i + 2] * 3;
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const idx of [a, b, c]) {
      normals[idx] += nx;
      normals[idx + 1] += ny;
      normals[idx + 2] += nz;
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const l = Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    normals[i] /= l;
    normals[i + 1] /= l;
    normals[i + 2] /= l;
  }
  return normals;
}

function viewBounds(all: Float32Array[]): { min: number[]; max: number[] } | null {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let any = false;
  for (const p of all) {
    for (let i = 0; i < p.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        const v = p[i + axis];
        if (!Number.isFinite(v)) continue;
        any = true;
        if (v < min[axis]) min[axis] = v;
        if (v > max[axis]) max[axis] = v;
      }
    }
  }
  return any ? { min, max } : null;
}

// ─── Orientation ─────────────────────────────────────────────────────────

export function rotX(a: number): Mat3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rotY(a: number): Mat3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

export function rotZ(a: number): Mat3 {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

export function mul(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      out[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
  }
  return out;
}

/** Tilt for flat apparel (radians about the view x axis). */
const FLAT_ITEM_TILT = 0.85;

/** Slight turn and tilt (view space) so flat framings still show depth. */
const PRESENTATION = mul(rotX(-0.18), rotZ(0.3));

/**
 * Skyrim's inventory camera looks at the model from +Y with Z up. This
 * renderer looks from -Y, so a half turn about Z converts between the two.
 * Actors face +Y, so worn items (helmets, cuirasses) show their front.
 */
const FROM_POSITIVE_Y = rotZ(Math.PI);

/**
 * BSInvMarker angles are clockwise when seen from the positive axis
 * (negative right-handed angles), applied Z first, then Y, then X.
 * Source: Beyond Skyrim wiki, "Nifskope Weapons Setup".
 */
function invMarkerRotation(x: number, y: number, z: number): Mat3 {
  return mul(PRESENTATION, mul(FROM_POSITIVE_Y, mul(rotX(-x), mul(rotY(-y), rotZ(-z)))));
}

/**
 * No BSInvMarker. Weapons: thinnest bounding-box axis toward the camera,
 * longest along the diagonal with the tip (the end farthest from the grip at
 * the origin) to the top right. Apparel: Z up, front toward the camera.
 */
function heuristicRotation(meshes: NifMesh[], framing: ThumbnailFraming): Mat3 {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  let tip: [number, number, number] = [0, 0, 0];
  let tipDistance = -1;
  for (const mesh of meshes) {
    const p = mesh.positions;
    for (let i = 0; i < p.length; i += 3) {
      for (let axis = 0; axis < 3; axis++) {
        if (p[i + axis] < min[axis]) min[axis] = p[i + axis];
        if (p[i + axis] > max[axis]) max[axis] = p[i + axis];
      }
      const d = p[i] * p[i] + p[i + 1] * p[i + 1] + p[i + 2] * p[i + 2];
      if (d > tipDistance) {
        tipDistance = d;
        tip = [p[i], p[i + 1], p[i + 2]];
      }
    }
  }
  const extents = [0, 1, 2].map((a) => max[a] - min[a]);
  const order = [0, 1, 2].sort((a, b) => extents[b] - extents[a]); // longest first
  const longest = order[0];
  const middle = order[1];
  const thinnest = order[2];

  if (framing === 'upright') {
    // Flat apparel lying in the XY plane (rings, circlets, amulets): seen from
    // the front and above so the band reads as a 3D loop.
    if (thinnest === 2) return mul(rotX(FLAT_ITEM_TILT), FROM_POSITIVE_Y);
    return mul(PRESENTATION, FROM_POSITIVE_Y);
  }

  // View basis: x (right) = middle, y (depth) = thinnest, z (up) = longest.
  const basis: Mat3 = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  basis[0 * 3 + middle] = 1;
  basis[1 * 3 + thinnest] = 1;
  basis[2 * 3 + longest] = 1;
  if (det3(basis) < 0) basis[0 * 3 + middle] = -1; // keep a proper rotation

  let m = mul(rotY(-Math.PI / 4), basis);
  const t = applyMat(m, tip);
  if (t[2] < 0) m = mul(rotY(Math.PI), m); // tip down → half turn in the screen plane
  const t2 = applyMat(m, tip);
  if (t2[0] < 0) m = mul(rotZ(Math.PI), m); // tip left → turn around the vertical
  return mul(PRESENTATION, m);
}

function applyMat(m: Mat3, v: [number, number, number]): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

function det3(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

// ─── Drawing ─────────────────────────────────────────────────────────────

function drawMesh(
  state: GlState,
  mesh: NifMesh,
  geometry: TransformedGeometry,
  textures: Map<string, ThumbnailTextureSource> | undefined,
  textureCache: Map<string, WebGLTexture | null>,
  created: { buffers: WebGLBuffer[]; textures: WebGLTexture[] },
): void {
  const { gl, locations } = state;

  const vertexCount = geometry.positions.length / 3;
  let indexData: Uint16Array | Uint32Array = mesh.indices;
  let indexType: number = gl.UNSIGNED_INT;
  if (vertexCount <= 0xffff) {
    indexData = Uint16Array.from(mesh.indices);
    indexType = gl.UNSIGNED_SHORT;
  } else if (!state.uintIndices) {
    return; // too many vertices for 16-bit indices on this device
  }

  const bind = (location: number, data: Float32Array, components: number): void => {
    if (location < 0) return;
    const buffer = gl.createBuffer();
    if (!buffer) return;
    created.buffers.push(buffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, components, gl.FLOAT, false, 0, 0);
  };

  bind(locations.position, geometry.positions, 3);
  bind(locations.normal, geometry.normals, 3);
  bind(locations.uv, mesh.uvs ?? new Float32Array(vertexCount * 2), 2);

  let texture: WebGLTexture | null = null;
  const texturePath = mesh.diffuseTexture;
  const textureSource = texturePath ? textures?.get(texturePath) : undefined;
  if (mesh.uvs && texturePath && textureSource) {
    if (!textureCache.has(texturePath)) {
      const uploaded = uploadTexture(gl, textureSource);
      if (uploaded) created.textures.push(uploaded);
      textureCache.set(texturePath, uploaded);
    }
    texture = textureCache.get(texturePath) ?? null;
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(locations.hasTexture, texture ? 1 : 0);
  gl.uniform1f(locations.alphaCutoff, texture && mesh.alphaTest ? Math.max(mesh.alphaThreshold, 0.05) : -1);

  const indexBuffer = gl.createBuffer();
  if (!indexBuffer) return;
  created.buffers.push(indexBuffer);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexData, gl.STATIC_DRAW);
  gl.drawElements(gl.TRIANGLES, indexData.length, indexType, 0);
}

function uploadTexture(gl: WebGLRenderingContext, source: ThumbnailTextureSource): WebGLTexture | null {
  // Resample into a power-of-two canvas so REPEAT wrapping and mipmaps work in WebGL 1.
  const sourceWidth = source.width;
  const sourceHeight = source.height;
  if (!sourceWidth || !sourceHeight) return null;
  const pot = (v: number): number => Math.min(256, 2 ** Math.max(0, Math.round(Math.log2(v))));
  const potCanvas = document.createElement('canvas');
  potCanvas.width = pot(sourceWidth);
  potCanvas.height = pot(sourceHeight);
  const ctx = potCanvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, potCanvas.width, potCanvas.height);

  const texture = gl.createTexture();
  if (!texture) return null;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, potCanvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  return texture;
}

function downsample(source: HTMLCanvasElement, size: number, mimeType: string): string | null {
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, size, size);
  const url = out.toDataURL(mimeType, 0.9);
  // Browsers without WebP encoding silently return PNG; both are fine.
  return url.startsWith('data:image/') ? url : null;
}
