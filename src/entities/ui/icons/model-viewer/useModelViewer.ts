import { shallowRef } from 'vue';
import type { ThumbnailFraming } from '@/shared/lib/nif';

export interface ModelViewerRequest {
  modelPath: string;
  name: string;
  keywords?: readonly string[] | null;
  framing?: ThumbnailFraming;
}

/** The item shown in the fullscreen 3D viewer, or null when it is closed. */
const current = shallowRef<ModelViewerRequest | null>(null);

export function useModelViewer() {
  return {
    current,
    open: (request: ModelViewerRequest) => {
      current.value = request;
    },
    close: () => {
      current.value = null;
    },
  };
}
