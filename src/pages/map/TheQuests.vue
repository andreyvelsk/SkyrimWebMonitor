<template>
  <div class="list">
    <quest-item
      name="The Way of the Voice"
      description="Speak to the Greybeards"
      :active="true"
    />
    <quest-item name="The Golden Claw" description="Return the claw to Lucan" />
    <quest-item
      name="Bleak Falls Barrow"
      description="Retrieve the Dragonstone"
      :completed="true"
    />
  </div>
</template>

<script setup lang="ts">
import { QuestItem } from '@/shared/ui';
</script>
