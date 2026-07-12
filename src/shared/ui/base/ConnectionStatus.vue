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

      <form
        class="endpoint-form"
        @submit.prevent="handleEndpointSubmit"
      >
        <label
          class="endpoint-form__label"
          for="ws-endpoint"
        >
          {{ $t('shared.ui.connectionStatus.wsEndpoint') }}
        </label>

        <div class="endpoint-form__controls">
          <input
            id="ws-endpoint"
            v-model.trim="endpointDraft"
            class="input endpoint-form__input"
            type="text"
            inputmode="url"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :aria-invalid="endpointError ? 'true' : 'false'"
            :placeholder="$t('shared.ui.connectionStatus.wsEndpointPlaceholder')"
          >

          <button
            class="btn btn-lg btn-primary endpoint-form__button"
            type="submit"
          >
            {{ $t('shared.ui.connectionStatus.saveEndpoint') }}
          </button>
        </div>

        <p
          v-if="endpointError"
          class="endpoint-form__error"
        >
          {{ endpointError }}
        </p>
      </form>

      <div class="actions">
        <button
          class="btn btn-lg btn-primary"
          @click="handleReconnect"
        >
          {{ $t('shared.ui.connectionStatus.reconnect') }}
        </button>
      </div>
    </div>

    <div class="attribution">
      <p>
        {{ $t('shared.ui.connectionStatus.mapFrom') }}
        <strong>Immersive Paper Map (3rd Edition)</strong>
      </p>
      <p>
        {{ $t('shared.ui.connectionStatus.iconsBy') }}
        <strong>game-icons.net</strong>
      </p>
    </div>

    <display-controls />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { CONNECTION_STATUS } from '@/shared/lib/constants/connection';
import { normalizeWsUrl } from '@/shared/lib/config/websocket';
import DisplayControls from './DisplayControls.vue';

type StatusState =
  | 'connected'
  | 'connecting'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

const { t } = useI18n();
const wsStore = useWebSocketStore();
const endpointDraft = ref(wsStore.endpointUrl);
const endpointError = ref('');

watch(
  () => wsStore.endpointUrl,
  (endpointUrl) => {
    endpointDraft.value = endpointUrl;
  }
);

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
    return wsStore.error || t('shared.ui.connectionStatus.failedHint');
  }
  if (state.value === 'disconnected' && wsStore.error) {
    return wsStore.error;
  }
  return '';
});

function handleEndpointSubmit(): void {
  endpointError.value = '';

  try {
    endpointDraft.value = normalizeWsUrl(endpointDraft.value);
    wsStore.updateEndpoint(endpointDraft.value);
  } catch {
    endpointError.value = t('shared.ui.connectionStatus.invalidEndpoint');
  }
}

function handleReconnect(): void {
  endpointError.value = '';
  void wsStore.reconnect();
}
</script>

<style scoped lang="scss">
.connection-status {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: var(--spacing-lg);

  > :first-child {
    flex: 1;
  }
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
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-text-accent);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-secondary);
  min-height: var(--font-size-sm);
  max-width: min(100%, 28rem);
  text-align: center;
}

.endpoint-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: min(100%, 30rem);
  margin-top: var(--spacing-sm);
}

.endpoint-form__label {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--skyrim-text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.endpoint-form__controls {
  display: flex;
  gap: var(--spacing-sm);
  width: 100%;
}

.endpoint-form__input {
  min-width: 0;
}

.endpoint-form__button {
  flex: 0 0 auto;
  min-width: 8rem;
  white-space: nowrap;
}

.endpoint-form__error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger-light);
}

.actions {
  margin-top: var(--spacing-sm);
}

.attribution {
  align-self: flex-start;
  margin: 0;
  font-size: var(--font-size-base, 0.75rem);
  color: var(--skyrim-text-dim);
  margin: calc(-1 * var(--spacing-md));
}

@media (max-width: 520px) {
  .endpoint-form__controls {
    flex-direction: column;
  }

  .endpoint-form__button {
    width: 100%;
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
