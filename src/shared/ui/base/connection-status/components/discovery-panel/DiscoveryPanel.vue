<template>
  <div class="discovery-panel">
    <p
      v-if="isRunning"
      class="discovery-panel__status"
    >
      {{ t('shared.ui.connectionStatus.discovery.searching') }}
    </p>

    <p
      v-if="isRunning && progress.total > 0"
      class="discovery-panel__progress"
    >
      {{
        t('shared.ui.connectionStatus.discovery.progress', {
          probed: progress.probed,
          total: progress.total,
        })
      }}
    </p>

    <p
      v-if="!isRunning"
      class="discovery-panel__not-found"
    >
      {{ t('shared.ui.connectionStatus.discovery.notFound') }}
    </p>

    <p
      v-if="showHttpsHint"
      class="discovery-panel__hint"
    >
      {{ t('shared.ui.connectionStatus.discovery.httpsHint') }}
    </p>

    <div class="discovery-panel__actions">
      <button
        v-if="isRunning"
        class="btn btn-lg btn-primary"
        type="button"
        @click="wsStore.cancelDiscovery()"
      >
        {{ t('shared.ui.connectionStatus.discovery.cancel') }}
      </button>

      <button
        v-else
        class="btn btn-lg btn-primary"
        type="button"
        @click="handleSearchAgain"
      >
        {{ t('shared.ui.connectionStatus.discovery.searchAgain') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';

const { t } = useI18n();
const wsStore = useWebSocketStore();
const { discovery: progress } = storeToRefs(wsStore);

const isRunning = computed(() => progress.value.status === 'running');

const showHttpsHint = computed(
  () => !isRunning.value && window.location.protocol === 'https:'
);

function handleSearchAgain(): void {
  void wsStore.runDiscovery();
}
</script>

<style scoped lang="scss">
.discovery-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  width: min(100%, 30rem);
  margin-top: var(--spacing-sm);
  text-align: center;
}

.discovery-panel__status {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-accent-main);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  animation: discovery-pulse 1.2s ease-in-out infinite;
}

.discovery-panel__progress {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.discovery-panel__not-found {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger-light);
}

.discovery-panel__hint {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.discovery-panel__actions {
  margin-top: var(--spacing-xs);
}

@keyframes discovery-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}
</style>
