<template>
  <div class="list">
    <magic-item
      name="Unrelenting Force"
      school="Fus Ro Dah"
      :cost="0"
      :is-shout="true"
    />
    <magic-item
      name="Fire Breath"
      school="Yol Toor Shul"
      :cost="0"
      :is-shout="true"
    />
    <magic-item
      name="Whirlwind Sprint"
      school="Wuld Nah Kest"
      :cost="0"
      :is-shout="true"
    />
  </div>
</template>

<script setup lang="ts">
import { MagicItem } from '@/shared/ui';
</script>

