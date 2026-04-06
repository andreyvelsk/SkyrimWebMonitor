<template>
  <div class="space-y-8">
    <StatusBar :value="healthValue" color="#FF3333" />
    <StatusBar :value="manaValue" color="#3366FF" />
    <StatusBar :value="staminaValue" color="#007F00" />
  </div>
</template>

<script setup>
import StatusBar from '@/components/StatusBar.vue'
</script>
