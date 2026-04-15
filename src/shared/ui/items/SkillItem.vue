<template>
  <div class="skill-item">
    <div class="skill-info">
      <span class="skill-name">{{ name }}</span>
      <span class="skill-level">{{ level }}</span>
    </div>
    <div class="skill-bar">
      <div class="skill-fill" :style="{ width: `${level}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ name: string; level: number }>();
</script>

<style scoped lang="scss">
.skill-item {
  padding: var(--spacing-sm);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  transition: all var(--transition-fast);

  &:hover {
    border-color: var(--skyrim-accent-gold-dim);
  }
}

.skill-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xs);
}

.skill-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);
}

.skill-level {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--skyrim-accent-gold);
}

.skill-bar {
  height: 4px;
  background-color: var(--skyrim-bg-dark);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.skill-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--skyrim-accent-gold-dim),
    var(--skyrim-accent-gold)
  );
  transition: width var(--transition-normal);
}
</style>
