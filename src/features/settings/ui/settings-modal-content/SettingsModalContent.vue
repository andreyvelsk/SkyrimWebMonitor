<template>
  <div class="settings-modal-content modal-content">
    <theme-gamut-picker />
    <gfx-icons-settings />
    <gfx-fonts-settings />
    <display-controls :teleport="false" />
  </div>
</template>

<script setup lang="ts">
import { DisplayControls } from '@/shared/ui';
import ThemeGamutPicker from '../theme-gamut-picker/ThemeGamutPicker.vue';
import GfxIconsSettings from '../gfx-icons-settings/GfxIconsSettings.vue';
import GfxFontsSettings from '../gfx-fonts-settings/GfxFontsSettings.vue';
</script>
