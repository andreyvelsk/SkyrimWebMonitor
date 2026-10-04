<template>
  <Teleport to="body">
    <Transition name="viewer">
      <div
        v-if="current"
        class="viewer"
        role="dialog"
        aria-modal="true"
        :aria-label="current.name"
      >
        <header class="viewer__head">
          <span class="viewer__name">{{ current.name }}</span>
          <button
            v-if="details.length"
            type="button"
            class="viewer__close"
            :class="{ 'viewer__info--on': showDetails }"
            :aria-label="t('shared.ui.viewer.details')"
            :aria-pressed="showDetails"
            @click="showDetails = !showDetails"
          >
            i
          </button>
          <button
            type="button"
            class="viewer__close"
            :aria-label="t('shared.ui.viewer.close')"
            @click="close"
          >
            ×
          </button>
        </header>

        <canvas
          ref="canvas"
          class="viewer__canvas"
          @pointerdown="onDown"
          @pointermove="onMove"
          @pointerup="onUp"
          @pointercancel="onUp"
          @wheel.prevent="onWheel"
        />

        <ul
          v-if="showDetails"
          class="viewer__details"
        >
          <li
            v-for="(d, i) in details"
            :key="i"
          >
            <span class="viewer__details-name">{{ d.name || `#${i + 1}` }}</span>
            <span>{{ d.texture ?? t('shared.ui.viewer.noTexture') }}</span>
            <span :class="{ 'viewer__details-bad': d.state !== 'ok' && d.state !== '' }">
              {{ d.state === 'ok' ? t('shared.ui.viewer.textureOk') : d.state }}{{ d.blend ? ' · blend' : '' }}{{ d.test ? ' · cut-out' : '' }}
            </span>
          </li>
        </ul>

        <p
          v-if="status"
          class="viewer__status"
        >
          {{ status }}
        </p>
        <p
          v-else
          class="viewer__hint"
        >
          {{ t('shared.ui.viewer.hint') }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { base64ToBytes } from '@/shared/lib/gfx';
import { getItemMaterial } from '@/shared/lib/constants/itemMaterials';
import { NifViewer, parseNif, type ThumbnailTextureSource } from '@/shared/lib/nif';
import { useSystemStore } from '@/stores/system/useSystemStore';
import { FEATURES } from '@/stores/system/lib/types';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModelViewer, type ModelViewerRequest } from './useModelViewer';

/** Texture size for close-up viewing (the thumbnails use 128). */
const TEXTURE_SIZE = 512;
const MAX_TEXTURES = 6;

const { t } = useI18n();
const { current, close } = useModelViewer();
const ws = useWebSocketStore();
const system = useSystemStore();

const canvas = ref<HTMLCanvasElement | null>(null);
const status = ref('');
/** Per-mesh texture diagnostics ("i" button): why a model looks untextured. */
const details = ref<Array<{ name: string; texture: string | null; state: string; blend: boolean; test: boolean }>>([]);
const showDetails = ref(false);
let viewer: NifViewer | null = null;
let loadToken = 0;

function decode(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function load(request: ModelViewerRequest): Promise<void> {
  const token = ++loadToken;
  status.value = t('shared.ui.viewer.loading');
  details.value = [];
  showDetails.value = false;
  await nextTick();
  if (!canvas.value) return;
  try {
    viewer?.dispose();
    viewer = new NifViewer(canvas.value);
    const file = await ws.downloadFile(request.modelPath);
    const model = parseNif(base64ToBytes(file.dataBase64));
    const textures = new Map<string, ThumbnailTextureSource>();
    const textureState = new Map<string, string>();
    if (system.isFeatureProvided(FEATURES.TEXTURE_PREVIEW)) {
      const withSize = system.isFeatureProvided(FEATURES.TEXTURE_PREVIEW_MAX_SIZE);
      const paths = [...new Set(model.meshes.map((m) => m.diffuseTexture).filter((p): p is string => !!p))].slice(0, MAX_TEXTURES);
      await Promise.all(
        paths.map(async (path) => {
          try {
            const preview = await ws.texturePreview(path, withSize ? TEXTURE_SIZE : undefined);
            const img = await decode(`data:${preview.mimeType};base64,${preview.imageBase64}`);
            if (img) textures.set(path, img);
            textureState.set(path, img ? 'ok' : 'decode failed');
          } catch (err) {
            // Missing or unsupported texture: material tint instead.
            textureState.set(path, err instanceof Error ? err.message : String(err));
          }
        }),
      );
    }
    if (token !== loadToken || !viewer) return;
    details.value = model.meshes.map((m) => ({
      name: m.name,
      texture: m.diffuseTexture,
      state: m.diffuseTexture ? (textureState.get(m.diffuseTexture) ?? t('shared.ui.viewer.notLoaded')) : '',
      blend: m.alphaBlend,
      test: m.alphaTest,
    }));
    const tint = getItemMaterial(request.keywords).rgb;
    const ok = viewer.setModel(model, { textures, tint, framing: request.framing });
    status.value = ok ? '' : t('shared.ui.viewer.empty');
  } catch (err) {
    if (token === loadToken) status.value = t('shared.ui.viewer.failed', { reason: err instanceof Error ? err.message : String(err) });
  }
}

watch(current, (request) => {
  if (request) void load(request);
  else {
    loadToken++;
    viewer?.dispose();
    viewer = null;
  }
});

// ─── Gestures: one finger turns, two fingers zoom ─────────────────────────
const pointers = new Map<number, { x: number; y: number }>();
let downAt = { x: 0, y: 0, t: 0 };
let lastTap = 0;
let pinchStart = 0;
let zoomStart = 1;

function onDown(e: PointerEvent): void {
  canvas.value?.setPointerCapture(e.pointerId);
  if (pointers.size === 0) downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2 && viewer) {
    const [a, b] = [...pointers.values()];
    pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
    zoomStart = viewer.zoom;
  }
}

function onMove(e: PointerEvent): void {
  const prev = pointers.get(e.pointerId);
  if (!prev || !viewer) return;
  const next = { x: e.clientX, y: e.clientY };
  pointers.set(e.pointerId, next);
  if (pointers.size === 1) {
    viewer.yaw += (next.x - prev.x) * 0.012;
    viewer.pitch = Math.max(-1.5, Math.min(1.5, viewer.pitch + (next.y - prev.y) * 0.012));
  } else if (pointers.size === 2 && pinchStart > 0) {
    const [a, b] = [...pointers.values()];
    viewer.zoom = Math.max(0.5, Math.min(6, (zoomStart * Math.hypot(a.x - b.x, a.y - b.y)) / pinchStart));
  }
  viewer.requestRender();
}

function onUp(e: PointerEvent): void {
  pointers.delete(e.pointerId);
  // Double tap (two quick taps without dragging) resets the view.
  const now = performance.now();
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 10;
  if (pointers.size === 0 && !moved && now - downAt.t < 250) {
    if (now - lastTap < 350) {
      resetView();
      lastTap = 0;
    } else {
      lastTap = now;
    }
  }
  if (pointers.size < 2) pinchStart = 0;
}

function onWheel(e: WheelEvent): void {
  if (!viewer) return;
  viewer.zoom = Math.max(0.5, Math.min(6, viewer.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  viewer.requestRender();
}

function resetView(): void {
  viewer?.reset();
}

onBeforeUnmount(() => viewer?.dispose());
</script>

<style scoped lang="scss">
.viewer {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 50% 45%, rgb(70 62 46 / 55%), transparent 60%),
    rgb(8 8 8);
}

.viewer__head {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: calc(var(--spacing-sm) + env(safe-area-inset-top)) var(--spacing-md) var(--spacing-sm);
}

.viewer__name {
  flex: 1;
  overflow: hidden;
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--skyrim-text-primary);
}

.viewer__close {
  width: 38px;
  height: 38px;
  padding: 0;
  background: rgb(0 0 0 / 50%);
  border: 1px solid var(--skyrim-border-medium);
  border-radius: 50%;
  color: var(--skyrim-text-primary);
  font-size: 1.3rem;
  cursor: pointer;
}

.viewer__canvas {
  flex: 1;
  width: 100%;
  min-height: 0;
  touch-action: none;
  cursor: grab;
}

.viewer__hint,
.viewer__status {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md) calc(var(--spacing-md) + env(safe-area-inset-bottom));
  font-size: var(--font-size-xs);
  text-align: center;
  color: var(--skyrim-text-dim);
}

.viewer__status {
  color: var(--skyrim-text-secondary);
}

.viewer-enter-active,
.viewer-leave-active {
  transition: opacity var(--transition-normal);
}

.viewer-enter-from,
.viewer-leave-to {
  opacity: 0;
}

.viewer__info--on {
  border-color: var(--skyrim-accent-main);
  color: var(--skyrim-accent-main);
}

.viewer__details {
  position: absolute;
  top: 52px;
  right: 8px;
  left: 8px;
  z-index: 1;
  max-height: 45%;
  margin: 0;
  overflow-y: auto;
  padding: 8px 10px;
  list-style: none;
  background: rgb(0 0 0 / 80%);
  border: 1px solid var(--skyrim-border-medium);
  border-radius: var(--radius-md);
  font-size: 0.68rem;
  color: var(--skyrim-text-secondary);

  li {
    display: flex;
    flex-direction: column;
    padding: 4px 0;
    border-bottom: 1px solid var(--skyrim-border-dark);
    overflow-wrap: anywhere;
  }
}

.viewer__details-name {
  color: var(--skyrim-text-primary);
}

.viewer__details-bad {
  color: #e8a060;
}
</style>
