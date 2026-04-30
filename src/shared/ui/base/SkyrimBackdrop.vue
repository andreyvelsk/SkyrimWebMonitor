<template>
  <Teleport
    v-if="teleport"
    :to="teleportTo"
  >
    <Transition :name="transitionName">
      <div
        v-if="visible"
        class="skyrim-backdrop"
        :class="rootClasses"
        :style="cssVars"
        :role="role"
        :aria-modal="ariaModal || undefined"
        :aria-live="ariaLive || undefined"
        @click.self="onSelfClick"
        @contextmenu="onContextmenu"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
  <Transition
    v-else
    :name="transitionName"
  >
    <div
      v-if="visible"
      class="skyrim-backdrop"
      :class="rootClasses"
      :style="cssVars"
      :role="role"
      :aria-modal="ariaModal || undefined"
      :aria-live="ariaLive || undefined"
      @click.self="onSelfClick"
      @contextmenu="onContextmenu"
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type BackdropPosition = 'fixed' | 'absolute';
type BackdropTone = 'overlay' | 'dim';

const props = withDefaults(
  defineProps<{
    /** Whether the backdrop is shown. */
    visible?: boolean;
    /** `fixed` covers the viewport; `absolute` covers the nearest positioned ancestor. */
    position?: BackdropPosition;
    /** `overlay` uses the global modal tint; `dim` is the lighter map-style tint. */
    tone?: BackdropTone;
    /** CSS blur radius in px. */
    blur?: number;
    /** z-index value (number or CSS expression). Defaults to `--z-modal-backdrop`. */
    zIndex?: number | string;
    /** Render via `<Teleport to="body">`. Disable for backdrops scoped to a container. */
    teleport?: boolean;
    /** Teleport target selector. */
    teleportTo?: string;
    /** Transition name used by the wrapping `<Transition>`. */
    transitionName?: string;
    /** ARIA role; common values: `dialog`, `alertdialog`, `status`. */
    role?: string;
    /** Sets `aria-modal` when the backdrop traps interaction. */
    ariaModal?: boolean;
    /** Sets `aria-live` for status backdrops. */
    ariaLive?: 'polite' | 'assertive' | 'off';
    /** When true, blocks pointer events outside the slot content. */
    blocking?: boolean;
    /** When true, click on the backdrop itself emits `close`. */
    closeOnSelfClick?: boolean;
    /** When true, prevents the native context menu on the backdrop. */
    preventContextMenu?: boolean;
  }>(),
  {
    visible: true,
    position: 'fixed',
    tone: 'overlay',
    blur: 2,
    zIndex: undefined,
    teleport: true,
    teleportTo: 'body',
    transitionName: 'skyrim-backdrop',
    role: undefined,
    ariaModal: false,
    ariaLive: undefined,
    blocking: false,
    closeOnSelfClick: false,
    preventContextMenu: false,
  }
);

const emit = defineEmits<{
  (_e: 'close'): void;
  (_e: 'self-click', _ev: MouseEvent): void;
}>();

const cssVars = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    '--skyrim-backdrop-blur': `${props.blur}px`,
  };
  if (props.zIndex !== undefined) {
    style['--skyrim-backdrop-z'] = String(props.zIndex);
  }
  return style;
});

const rootClasses = computed(() => [
  `skyrim-backdrop--${props.position}`,
  `skyrim-backdrop--${props.tone}`,
  { 'skyrim-backdrop--blocking': props.blocking },
]);

function onSelfClick(event: MouseEvent): void {
  emit('self-click', event);
  if (props.closeOnSelfClick) emit('close');
}

function onContextmenu(event: MouseEvent): void {
  if (props.preventContextMenu) event.preventDefault();
}
</script>

<style scoped lang="scss">
.skyrim-backdrop {
  display: flex;
  align-items: center;
  justify-content: center;
  inset: 0;
  z-index: var(--skyrim-backdrop-z, var(--z-modal-backdrop));
  backdrop-filter: blur(var(--skyrim-backdrop-blur, 2px));
}

.skyrim-backdrop--fixed {
  position: fixed;
}

.skyrim-backdrop--absolute {
  position: absolute;
}

.skyrim-backdrop--overlay {
  background-color: var(--bg-overlay);
}

.skyrim-backdrop--dim {
  // Lighter tint sourced from --skyrim-bg-dark.
  background-color: rgb(13 13 13 / 70%);
}

.skyrim-backdrop--blocking {
  pointer-events: all;
}

/* Default fade transition. Consumers can override by passing their own
   `transition-name` and styling the matching classes. */
.skyrim-backdrop-enter-active,
.skyrim-backdrop-leave-active {
  transition: opacity var(--transition-normal);
}

.skyrim-backdrop-enter-from,
.skyrim-backdrop-leave-to {
  opacity: 0;
}
</style>
