<template>
  <div class="d-flex flex-1 flex-center p-md">
    <hotkey-slots-grid
      disable-inactive
      class="hotkeys-page-grid"
      gap="md"
      @select="triggerSlot"
    />
  </div>
</template>

<script setup lang="ts">
import { HotkeySlotsGrid } from '@/shared/ui';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import type { HotkeySlot } from '@/api/websocket';

const wsStore = useWebSocketStore();

function triggerSlot(slot: HotkeySlot) {
  wsStore.sendCommand({ command: 'hotkey_trigger', slot });
}
</script>

<style scoped lang="scss">
.hotkeys-page-grid {
  max-width: 640px;
}
</style>
