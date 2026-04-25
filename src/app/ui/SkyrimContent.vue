<template>
  <div
    class="skyrim-panel animate-slide-down"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @touchcancel.passive="onTouchCancel"
  >
    <Transition
      :name="transitionName"
      mode="out-in"
    >
      <component
        :is="currentComponent"
        v-if="currentComponent"
        :key="`${tab}-${subTab}`"
      />
      <div
        v-else
        :key="`${tab}-${subTab}-empty`"
        class="empty-state"
      >
        <p class="text-secondary">
          {{ $t('app.content.emptyState') }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePageRouter } from '@/app/router/usePageRouter';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';

const props = defineProps<{ tab: string; subTab: string }>();

const nav = useNavigationStore();

const transitionName = computed(() => {
  return nav.transitionDirection
    ? `slide-${nav.transitionDirection}`
    : 'no-slide';
});

const touchStartX = ref<number | null>(null);
const THRESHOLD = 50;

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches?.[0]?.clientX ?? null;
};

const onTouchEnd = (e: TouchEvent) => {
  if (touchStartX.value === null) return;
  const endX = e.changedTouches?.[0]?.clientX ?? 0;
  const delta = endX - touchStartX.value;
  touchStartX.value = null;
  if (Math.abs(delta) < THRESHOLD) return;
  if (delta < 0) {
    nav.nextSubTab();
  } else {
    nav.prevSubTab();
  }
};

const onTouchCancel = () => {
  touchStartX.value = null;
};

const currentComponent = computed(() => {
  return usePageRouter(props.tab, props.subTab);
});
</script>

<style scoped lang="scss">
.skyrim-panel {
  position: relative;
  background-color: var(--skyrim-bg-medium);
  padding: var(--spacing-md);
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Slide animations */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-enter-to {
  transform: translateX(0);
}

.slide-left-leave-from {
  transform: translateX(0);
}

.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-from {
  transform: translateX(-100%);
}

.slide-right-enter-to {
  transform: translateX(0);
}

.slide-right-leave-from {
  transform: translateX(0);
}

.slide-right-leave-to {
  transform: translateX(100%);
}

.no-slide-enter-active,
.no-slide-leave-active {
  transition: none;
}
</style>
