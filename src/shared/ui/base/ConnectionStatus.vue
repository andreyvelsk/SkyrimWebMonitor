<template>
  <div class="connection-status">
    <div class="flex-center flex-col gap-md">
      <div class="indicator">
        <span
          class="indicator__dot"
          :class="`indicator__dot--${state}`"
        />
      </div>

      <Transition
        name="fade"
        mode="out-in"
      >
        <h2
          :key="statusText"
          class="title"
        >
          {{ statusText }}
        </h2>
      </Transition>

      <p class="subtitle">
        {{ subText }}
      </p>

      <div
        v-if="canReconnect"
        class="actions"
      >
        <button
          class="btn btn-lg btn-primary"
          @click="handleReconnect"
        >
          {{ $t('shared.ui.connectionStatus.reconnect') }}
        </button>
      </div>
    </div>

    <p class="attribution">
      {{ $t('shared.ui.connectionStatus.iconsBy') }}
      <strong>game-icons.net</strong>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';

type StatusState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

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
  return '';
});

const canReconnect = computed(() => state.value !== 'connected');

function handleReconnect(): void {
  wsStore.reconnect();
}
</script>

<style scoped lang="scss">
.connection-status {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--spacing-lg);
}

.connection-panel {
  align-items: center;
  min-width: 260px;
  max-width: 90vw;
  padding: var(--spacing-xl) var(--spacing-lg);
  text-align: center;
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
      background-color: var(--color-success);
      box-shadow: 0 0 12px var(--color-success-glow);
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
      background-color: var(--color-danger);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
  height: var(--font-size-sm);
}

.actions {
  margin-top: var(--spacing-sm);
}

.attribution {
  position: absolute;
  bottom: 2px;
  left: 2px;
  margin: 0;
  font-size: var(--font-size-base, 0.75rem);
  color: var(--skyrim-text-dim);
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
