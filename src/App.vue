<template>
  <div class="min-h-screen bg-black flex items-center justify-center">
    <main class="max-w-7xl grow mx-auto p-4 sm:p-6 lg:p-8">
      <connection-status v-if="!wsStore.isConnected" />
      <general-status v-else />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useWebSocketStore } from '@/stores/useWebsocketStore';
import ConnectionStatus from '@/components/ConnectionStatus.vue';
import GeneralStatus from '@/components/GeneralStatus.vue';

const wsStore = useWebSocketStore();

// Connect to WebSocket on component mount
onMounted(() => {
  wsStore.connect();
});
</script>
