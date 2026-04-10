<template>
  <div class="list">
    <skill-item
      name="One-Handed"
      :level="45"
    />
    <skill-item
      name="Destruction"
      :level="38"
    />
    <skill-item
      name="Heavy Armor"
      :level="52"
    />
    <skill-item
      name="Smithing"
      :level="67"
    />
    <skill-item
      name="Enchanting"
      :level="41"
    />
  </div>
</template>

<script setup lang="ts">
import { SkillItem } from '@/shared/ui';
</script>

