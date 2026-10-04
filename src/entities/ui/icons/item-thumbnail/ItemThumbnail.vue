<template>
  <div
    ref="root"
    class="item-thumbnail"
    :class="{
      'item-thumbnail--rendered': !!url,
      'item-thumbnail--expandable': canExpand,
    }"
    :style="{ '--thumb-size': `${size}px` }"
    :role="canExpand ? 'button' : undefined"
    :tabindex="canExpand ? 0 : undefined"
    :aria-label="canExpand ? t('shared.ui.viewer.open', { name }) : undefined"
    @click="expand"
  >
    <img
      v-if="url"
      :src="url"
      :width="size"
      :height="size"
      alt=""
      decoding="async"
      class="item-thumbnail__image"
    >
    <template v-else>
      <base-icon
        :icon-path="fallbackIconPath"
        :size="iconSize"
      />
      <span
        v-if="isPending"
        class="item-thumbnail__loader"
        aria-hidden="true"
      />
    </template>
    <span
      v-if="canExpand"
      class="item-thumbnail__badge"
      aria-hidden="true"
    >3D</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { BaseIcon } from '@/shared/ui';
import type { ThumbnailFraming } from '@/shared/lib/nif';
import { useItemThumbnailsStore } from '@/stores/item-thumbnails/useItemThumbnailsStore';
import { useI18n } from 'vue-i18n';
import { useModelViewer } from '../model-viewer/useModelViewer';

interface Props {
  /** Category icon shown until (or instead of) the 3D render. */
  fallbackIconPath: string;
  modelPath?: string | null;
  keywords?: readonly string[] | null;
  /** Box size in px; only the rendered 3D thumbnail fills it. */
  size?: number;
  framing?: ThumbnailFraming;
  /** Tap opens the fullscreen 3D viewer (large previews). */
  expandable?: boolean;
  /** Item name for the viewer title. */
  name?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelPath: null,
  keywords: null,
  size: 32,
  framing: 'diagonal',
  expandable: false,
  name: '',
});

const { t } = useI18n();
const modelViewer = useModelViewer();

const store = useItemThumbnailsStore();
const root = ref<HTMLElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;

/** Fallback icons keep the standard preview icon size, independent of the box. */
const iconSize = computed(() => Math.min(48, props.size));
const source = computed(() => ({
  modelPath: props.modelPath,
  keywords: props.keywords,
  framing: props.framing,
}));
const url = computed(() => store.urlFor(source.value));
const isPending = computed(() => !!props.modelPath && !url.value && store.isPending(source.value));

/** Only offered once a render worked, so the viewer will too. */
const canExpand = computed(() => props.expandable && !!props.modelPath && !!url.value);

function expand(): void {
  if (!canExpand.value || !props.modelPath) return;
  modelViewer.open({ modelPath: props.modelPath, name: props.name, keywords: props.keywords, framing: props.framing });
}

function requestIfVisible(): void {
  if (isVisible.value && props.modelPath) store.request(source.value);
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !root.value) {
    isVisible.value = true;
    requestIfVisible();
    return;
  }
  // Only render what the user can see; long lists stay cheap.
  observer = new IntersectionObserver(
    (entries) => {
      isVisible.value = entries.some((entry) => entry.isIntersecting);
      requestIfVisible();
    },
    { rootMargin: '120px' },
  );
  observer.observe(root.value);
});

onBeforeUnmount(() => observer?.disconnect());

watch(source, requestIfVisible);
</script>

<style scoped lang="scss">
.item-thumbnail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;

  // The fixed-size box only applies to the rendered 3D thumbnail;
  // the fallback icon keeps its natural standard size.
  &--rendered {
    width: var(--thumb-size);
    height: var(--thumb-size);
  }

  &__image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    animation: item-thumbnail-in var(--transition-fast, 150ms) ease-out;
  }

  &--expandable {
    position: relative;
    cursor: zoom-in;
  }

  &__loader {
    width: 12px;
    height: 12px;
    position: absolute;
    border: 2px solid var(--skyrim-border-medium);
    border-top-color: var(--skyrim-accent-main);
    border-radius: 50%;
    animation: item-thumbnail-spin 0.8s linear infinite;
  }

  &__badge {
    position: absolute;
    right: 2px;
    bottom: 2px;
    padding: 0 5px;
    background: rgb(0 0 0 / 65%);
    border: 1px solid var(--skyrim-border-medium);
    border-radius: 999px;
    font-family: var(--font-heading);
    font-size: 0.56rem;
    letter-spacing: 0.08em;
    color: var(--skyrim-text-secondary);
    pointer-events: none;
  }
}

@keyframes item-thumbnail-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes item-thumbnail-in {
  from {
    opacity: 0;
    transform: scale(0.92);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
