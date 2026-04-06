<template>
  <div class="space-y-8">
    <StatusBar
      :value="monitorStore.calculatedStates.health"
      color="#FF3333"
    />
    <StatusBar
      :value="monitorStore.calculatedStates.magicka"
      color="#3366FF"
    />
    <StatusBar
      :value="monitorStore.calculatedStates.stamina"
      color="#007F00"
    />
  </div>
</template>

<script setup>
import StatusBar from '@/components/StatusBar.vue'
import { useMonitorStore } from '@/stores/use-monitor-state/useMonitorStore'

const monitorStore = useMonitorStore()
</script>
