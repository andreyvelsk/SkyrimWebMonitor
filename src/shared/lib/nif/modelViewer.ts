/**
 * Interactive WebGL 1 viewer for one NIF model (fullscreen item inspection).
 *
 * Geometry is uploaded once; each frame only changes the rotation and zoom
 * uniforms, so dragging stays smooth on handheld GPUs. Lighting matches the
 * thumbnail renderer (lights fixed to the camera, model turns under them).
 */
import { computeNormals, modelOrientation, mul, rotX, rotZ, type ThumbnailFraming, type ThumbnailTextureSource } from './renderThumbnail';
import type { NifModel } from './types';

const VERTEX_SHADER = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUv;
uniform mat3 uRotation;
uniform vec3 uCenter;
uniform float uScale;
uniform float uDepth;
uniform vec2 uAspect;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vec3 p = uRotation * (aPosition - uCenter) * uScale;
  vNormal = uRotation * aNormal;
  vUv = aUv;
  // View space: x right, z up, y depth (camera looks along +y).
  gl_Position = vec4(p.x * uAspect.x, p.z * uAspect.y, p.y * uDepth, 1.0);
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
  if (dot(n, toCamera) < 0.0) n = -n;
  vec3 keyDir = normalize(vec3(-0.55, -0.7, 0.75));
  vec3 fillDir = normalize(vec3(0.8, -0.4, -0.2));
  float key = max(dot(n, keyDir), 0.0);
  float fill = max(dot(n, fillDir), 0.0);
  float rim = pow(1.0 - max(dot(n, toCamera), 0.0), 2.5);
  vec3 halfVec = normalize(keyDir + toCamera);
  float spec = pow(max(dot(n, halfVec), 0.0), 32.0);
  vec3 color = base.rgb * (0.38 + 0.8 * key * vec3(1.0, 0.96, 0.9) + 0.25 * fill * vec3(0.8, 0.88, 1.0));
  color += spec * 0.1 * vec3(1.0, 0.97, 0.9);
  color += rim * 0.16 * vec3(0.85, 0.9, 1.0);
  float alpha = uOpacity < 0.0 ? 1.0 : (uHasTexture ? base.a : uOpacity);
  gl_FragColor = vec4(min(color, vec3(1.0)), alpha);
}
`;

/** Opacity of untextured see-through meshes. */
const GLASS_OPACITY = 0.35;

interface DrawCall {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  uv: WebGLBuffer;
  index: WebGLBuffer;
  count: number;
  indexType: number;
  texture: WebGLTexture | null;
  alphaCutoff: number;
  /** Drawn after opaque meshes, blended, without depth writes. */
  blend: boolean;
}

export interface ViewerModelOptions {
  textures?: Map<string, ThumbnailTextureSource>;
  tint?: [number, number, number];
  framing?: ThumbnailFraming;
}

export class NifViewer {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private draws: DrawCall[] = [];
  private textures: WebGLTexture[] = [];
  private base: number[] = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  private center: [number, number, number] = [0, 0, 0];
  private radius = 1;
  private tint: [number, number, number] = [0.72, 0.7, 0.66];
  private frame = 0;

  /** Turn around the vertical axis (radians). */
  yaw = 0;
  /** Tilt toward/away from the camera (radians). */
  pitch = 0;
  /** 1 = model fills the view. */
  zoom = 1;

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL is not available');
    this.gl = gl;
    const program = link(gl, VERTEX_SHADER, FRAGMENT_SHADER);
    if (!program) throw new Error('Shader setup failed');
    this.program = program;
    gl.getExtension('OES_element_index_uint');
  }

  setModel(model: NifModel, options: ViewerModelOptions = {}): boolean {
    this.clear();
    const gl = this.gl;
    const meshes = model.meshes.filter((m) => m.indices.length > 0);
    if (!meshes.length) return false;
    if (options.tint) this.tint = options.tint;
    this.base = modelOrientation(model, options.framing ?? 'diagonal');

    // Bounding sphere in model space (rotation does not change it).
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const m of meshes) {
      for (let i = 0; i < m.positions.length; i += 3) {
        for (let a = 0; a < 3; a++) {
          const v = m.positions[i + a];
          if (!Number.isFinite(v)) continue;
          if (v < min[a]) min[a] = v;
          if (v > max[a]) max[a] = v;
        }
      }
    }
    this.center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
    let r = 0;
    for (const m of meshes) {
      for (let i = 0; i < m.positions.length; i += 3) {
        const d = Math.hypot(m.positions[i] - this.center[0], m.positions[i + 1] - this.center[1], m.positions[i + 2] - this.center[2]);
        if (Number.isFinite(d) && d > r) r = d;
      }
    }
    this.radius = r || 1;

    const uint = gl.getExtension('OES_element_index_uint') !== null;
    const textureCache = new Map<string, WebGLTexture | null>();
    for (const mesh of meshes) {
      const vertexCount = mesh.positions.length / 3;
      let indexData: Uint16Array | Uint32Array = mesh.indices;
      let indexType: number = gl.UNSIGNED_INT;
      if (vertexCount <= 0xffff) {
        indexData = Uint16Array.from(mesh.indices);
        indexType = gl.UNSIGNED_SHORT;
      } else if (!uint) {
        continue;
      }
      const buffer = (data: Float32Array | Uint16Array | Uint32Array, target: number): WebGLBuffer | null => {
        const b = gl.createBuffer();
        if (!b) return null;
        gl.bindBuffer(target, b);
        gl.bufferData(target, data, gl.STATIC_DRAW);
        return b;
      };
      const normals = mesh.normals ?? computeNormals(mesh.positions, mesh.indices);
      const position = buffer(mesh.positions, gl.ARRAY_BUFFER);
      const normal = buffer(normals, gl.ARRAY_BUFFER);
      const uv = buffer(mesh.uvs ?? new Float32Array(vertexCount * 2), gl.ARRAY_BUFFER);
      const index = buffer(indexData, gl.ELEMENT_ARRAY_BUFFER);
      if (!position || !normal || !uv || !index) continue;

      let texture: WebGLTexture | null = null;
      const path = mesh.diffuseTexture;
      const source = path ? options.textures?.get(path) : undefined;
      if (mesh.uvs && path && source) {
        if (!textureCache.has(path)) {
          const t = upload(gl, source);
          if (t) this.textures.push(t);
          textureCache.set(path, t);
        }
        texture = textureCache.get(path) ?? null;
      }
      this.draws.push({
        position,
        normal,
        uv,
        index,
        count: indexData.length,
        indexType,
        texture,
        alphaCutoff: texture && mesh.alphaTest ? Math.max(mesh.alphaThreshold, 0.05) : -1,
        blend: mesh.alphaBlend,
      });
    }
    this.requestRender();
    return this.draws.length > 0;
  }

  reset(): void {
    this.yaw = 0;
    this.pitch = 0;
    this.zoom = 1;
    this.requestRender();
  }

  requestRender(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  render(): void {
    const { gl, canvas } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.program);

    const rotation = mul(rotX(this.pitch), mul(rotZ(this.yaw), this.base));
    const u = (name: string) => gl.getUniformLocation(this.program, name);
    // WebGL wants column-major; our matrices are row-major, so transpose.
    gl.uniformMatrix3fv(u('uRotation'), false, transpose(rotation));
    gl.uniform3f(u('uCenter'), this.center[0], this.center[1], this.center[2]);
    const fit = (0.92 / this.radius) * this.zoom;
    gl.uniform1f(u('uScale'), fit);
    gl.uniform1f(u('uDepth'), 0.9 / Math.max(this.radius * fit, 1e-3));
    const aspect = w / h;
    gl.uniform2f(u('uAspect'), aspect > 1 ? 1 / aspect : 1, aspect > 1 ? 1 : aspect);
    gl.uniform3f(u('uTint'), this.tint[0], this.tint[1], this.tint[2]);
    gl.uniform1i(u('uTexture'), 0);

    const aPosition = gl.getAttribLocation(this.program, 'aPosition');
    const aNormal = gl.getAttribLocation(this.program, 'aNormal');
    const aUv = gl.getAttribLocation(this.program, 'aUv');
    // Opaque first, then see-through surfaces (potion glass) over them.
    const ordered = [...this.draws.filter((d) => !d.blend), ...this.draws.filter((d) => d.blend)];
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    for (const d of ordered) {
      if (d.blend) {
        gl.enable(gl.BLEND);
        gl.depthMask(false);
      } else {
        gl.disable(gl.BLEND);
        gl.depthMask(true);
      }
      gl.uniform1f(u('uOpacity'), d.blend ? GLASS_OPACITY : -1);
      bindAttr(gl, aPosition, d.position, 3);
      bindAttr(gl, aNormal, d.normal, 3);
      bindAttr(gl, aUv, d.uv, 2);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, d.texture);
      gl.uniform1i(u('uHasTexture'), d.texture ? 1 : 0);
      gl.uniform1f(u('uAlphaCutoff'), d.alphaCutoff);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, d.index);
      gl.drawElements(gl.TRIANGLES, d.count, d.indexType, 0);
    }
    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }

  private clear(): void {
    const gl = this.gl;
    for (const d of this.draws) {
      gl.deleteBuffer(d.position);
      gl.deleteBuffer(d.normal);
      gl.deleteBuffer(d.uv);
      gl.deleteBuffer(d.index);
    }
    for (const t of this.textures) gl.deleteTexture(t);
    this.draws = [];
    this.textures = [];
  }

  dispose(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.clear();
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

function transpose(m: number[]): Float32Array {
  return new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
}

function bindAttr(gl: WebGLRenderingContext, location: number, buffer: WebGLBuffer, size: number): void {
  if (location < 0) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

function link(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram | null {
  const compile = (type: number, src: string): WebGLShader | null => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[NifViewer] shader error:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const v = compile(gl.VERTEX_SHADER, vs);
  const f = compile(gl.FRAGMENT_SHADER, fs);
  const p = gl.createProgram();
  if (!v || !f || !p) return null;
  gl.attachShader(p, v);
  gl.attachShader(p, f);
  gl.linkProgram(p);
  return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
}

function upload(gl: WebGLRenderingContext, source: ThumbnailTextureSource): WebGLTexture | null {
  if (!source.width || !source.height) return null;
  const pot = (v: number): number => Math.min(1024, 2 ** Math.max(0, Math.round(Math.log2(v))));
  const c = document.createElement('canvas');
  c.width = pot(source.width);
  c.height = pot(source.height);
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, c.width, c.height);
  const t = gl.createTexture();
  if (!t) return null;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  return t;
}
