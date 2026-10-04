/**
 * Builds one item thumbnail: download the model over WebSocket, parse it,
 * fetch its diffuse textures (downscaled on the game side), render.
 */
import { base64ToBytes } from '@/shared/lib/gfx';
import {
  parseNif,
  renderNifThumbnail,
  type ThumbnailFraming,
  type ThumbnailTextureSource,
} from '@/shared/lib/nif';
import type { FileDownloadResultData, TexturePreviewResultData } from '@/api/websocket';

/** Edge length of stored thumbnails (px). Rows show them at ~32px, previews at ~96px. */
export const THUMBNAIL_SIZE = 128;
/** Longest texture edge requested from the game. */
export const TEXTURE_MAX_SIZE = 128;
/** Upper bound on textures fetched per model (keeps first render fast). */
const MAX_TEXTURES_PER_MODEL = 4;

export interface ThumbnailJob {
  modelPath: string;
  tint: [number, number, number];
  framing: ThumbnailFraming;
}

type TexturePreviewFn = (path: string, maxSize?: number) => Promise<TexturePreviewResultData>;

export interface ThumbnailDeps {
  downloadFile: (path: string) => Promise<FileDownloadResultData>;
  texturePreview: TexturePreviewFn | null;
  /** Shared across jobs: many items reuse the same texture sheet. */
  textureCache: Map<string, Promise<HTMLImageElement | null>>;
}

export async function generateThumbnail(job: ThumbnailJob, deps: ThumbnailDeps): Promise<string | null> {
  const file = await deps.downloadFile(job.modelPath);
  const model = parseNif(base64ToBytes(file.dataBase64));
  if (model.meshes.length === 0) return null;

  const textures = new Map<string, ThumbnailTextureSource>();
  const texturePreview = deps.texturePreview;
  if (texturePreview) {
    const paths = [...new Set(model.meshes.map((m) => m.diffuseTexture).filter((p): p is string => !!p))]
      .slice(0, MAX_TEXTURES_PER_MODEL);
    const loaded = await Promise.all(
      paths.map((path) => loadTexture(path, texturePreview, deps.textureCache)),
    );
    paths.forEach((path, i) => {
      const image = loaded[i];
      if (image) textures.set(path, image);
    });
  }

  return renderNifThumbnail(model, {
    size: THUMBNAIL_SIZE,
    tint: job.tint,
    textures,
    framing: job.framing,
  });
}

function loadTexture(
  path: string,
  texturePreview: TexturePreviewFn,
  textureCache: Map<string, Promise<HTMLImageElement | null>>,
): Promise<HTMLImageElement | null> {
  const cached = textureCache.get(path);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const preview = await texturePreview(path, TEXTURE_MAX_SIZE);
      return await decodeImage(`data:${preview.mimeType};base64,${preview.imageBase64}`);
    } catch {
      // Missing texture, or a format the plugin cannot decode: the mesh falls back to the material tint.
      return null;
    }
  })();
  textureCache.set(path, promise);
  return promise;
}

function decodeImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}
