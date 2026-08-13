<template>
  <div class="settings-modal-content modal-content">
    <theme-gamut-picker />
    <display-controls :teleport="false" />
  </div>
</template>

<script setup lang="ts">
import { DisplayControls } from '@/shared/ui';
import ThemeGamutPicker from '../theme-gamut-picker/ThemeGamutPicker.vue';
</script>
