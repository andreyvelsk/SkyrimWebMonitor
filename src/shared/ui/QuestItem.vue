<template>
  <div
    class="quest-item"
    :class="{ active, completed }"
  >
    <div class="quest-marker">
      <svg
        v-if="completed"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20 6L9 17l-5-5 1.41-1.41L9 14.17l9.59-9.58L20 6z" />
      </svg>
      <svg
        v-else-if="active"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle
          cx="12"
          cy="12"
          r="8"
        />
      </svg>
    </div>
    <div class="quest-info">
      <span class="quest-name">{{ name }}</span>
      <span class="quest-desc">{{ description }}</span>
    </div>
    <div
      v-if="active"
      class="quest-badge"
    >
      {{ $t('shared.ui.questItem.active') }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  description: string;
  active?: boolean;
  completed?: boolean;
}>();
</script>

<style scoped lang="scss">
.quest-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: rgb(201 162 39 / 8%);
    border-color: var(--skyrim-accent-gold-dim);
  }

  &.active {
    border-left: 3px solid var(--skyrim-accent-gold);
    background-color: rgb(201 162 39 / 5%);
  }

  &.completed {
    opacity: 0.6;
  }
}

.quest-marker {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: 16px;
    height: 16px;
    color: var(--skyrim-text-secondary);
  }
}

.quest-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quest-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);
}

.quest-desc {
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.quest-badge {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-accent-gold);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--skyrim-bg-dark);
  border-radius: var(--radius-sm);
}
</style>
