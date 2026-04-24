<template>
  <div class="connection-status">
    <div
      class="panel"
      :class="`panel--${state}`"
    >
      <div class="indicator">
        <span
          class="indicator__dot"
          :class="`indicator__dot--${state}`"
        />
      </div>

      <h2 class="title">
        {{ statusText }}
      </h2>

      <p
        v-if="subText"
        class="subtitle"
      >
        {{ subText }}
      </p>

      <div
        v-if="canReconnect"
        class="actions"
      >
        <button
          class="btn-reconnect"
          @click="handleReconnect"
        >
          {{ $t('shared.ui.connectionStatus.reconnect') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';

type StatusState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'failed';

const { t } = useI18n();
const wsStore = useWebSocketStore();

const state = computed<StatusState>(() => {
  if (wsStore.reconnectFailed) return 'failed';
  if (wsStore.status === CONNECTION_STATUS.CONNECTED) return 'connected';
  if (wsStore.status === CONNECTION_STATUS.CONNECTING) return 'connecting';
  if (wsStore.status === CONNECTION_STATUS.RECONNECTING) return 'reconnecting';
  return 'disconnected';
});

const statusText = computed(() => {
  switch (state.value) {
    case 'connected':
      return t('shared.ui.connectionStatus.connected');
    case 'connecting':
      return t('shared.ui.connectionStatus.connecting');
    case 'reconnecting':
      return t('shared.ui.connectionStatus.reconnecting');
    case 'failed':
      return t('shared.ui.connectionStatus.failed');
    default:
      return t('shared.ui.connectionStatus.disconnected');
  }
});

const subText = computed(() => {
  if (state.value === 'reconnecting' && wsStore.reconnectMaxAttempts > 0) {
    return t('shared.ui.connectionStatus.attempt', {
      current: wsStore.reconnectAttempt,
      total: wsStore.reconnectMaxAttempts,
    });
  }
  if (state.value === 'failed') {
    return t('shared.ui.connectionStatus.failedHint');
  }
  return '';
});

const isBusy = computed(
  () => state.value === 'connecting' || state.value === 'reconnecting'
);

const canReconnect = computed(() => state.value !== 'connected');

function handleReconnect(): void {
  if (isBusy.value) return;
  wsStore.reconnect();
}
</script>

<style scoped lang="scss">
.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--spacing-lg);
  background-color: var(--skyrim-bg-dark);
}

.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  min-width: 260px;
  max-width: 90vw;
  padding: var(--spacing-xl) var(--spacing-lg);
  background-color: var(--skyrim-bg-medium);
  border: 1px solid var(--skyrim-border-dark);
  box-shadow: var(--shadow-strong), inset 0 0 60px rgb(0 0 0 / 30%);
  text-align: center;
  color: var(--skyrim-text-primary);
  font-family: var(--font-body);

  &--connecting,
  &--reconnecting {
    border-color: var(--skyrim-accent-gold-dim);
  }

  &--failed,
  &--disconnected {
    border-color: #7a2a2a;
  }
}

.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;

  &__dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    background-color: var(--skyrim-text-dim);
    box-shadow: 0 0 0 4px rgb(0 0 0 / 30%);

    &--connected {
      background-color: #4caf50;
      box-shadow: 0 0 12px rgb(76 175 80 / 60%);
    }

    &--connecting {
      background-color: var(--skyrim-accent-gold);
      animation: status-pulse 1.2s ease-in-out infinite;
    }

    &--reconnecting {
      background-color: var(--skyrim-accent-gold-light);
      animation: status-pulse 0.8s ease-in-out infinite;
    }

    &--disconnected,
    &--failed {
      background-color: #c04a4a;
    }
  }
}

.title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--skyrim-text-accent);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
}

.error {
  margin: 0;
  font-size: var(--font-size-xs);
  color: #d08a8a;
  opacity: 0.85;
  word-break: break-word;
}

.actions {
  margin-top: var(--spacing-sm);
}

.btn-reconnect {
  padding: var(--spacing-sm) var(--spacing-lg);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 2px solid var(--skyrim-border-dark);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: rgb(201 162 39 / 12%);
    border-color: var(--skyrim-accent-gold-dim);
    color: var(--skyrim-text-accent);
  }

  &:active:not(:disabled) {
    background-color: rgb(201 162 39 / 20%);
    border-color: var(--skyrim-accent-gold);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

@keyframes status-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.45;
    transform: scale(0.8);
  }
}
</style>
