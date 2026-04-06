<template>
  <div class="text-white bg-gray-800 p-4 rounded-lg text-center">
    {{ serverResponse }}
  </div>
</template>

<script setup>
import { useWebSocketStore } from '@/stores/websocket'

const wsStore = useWebSocketStore()
const { serverResponse } = wsStore
</script>
