<template>
  <div
    class="magic-item"
    :class="{ 'is-shout': isShout }"
  >
    <div class="magic-icon">
      <svg
        v-if="isShout"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
      </svg>
    </div>
    <div class="magic-info">
      <span class="magic-name">{{ name }}</span>
      <span class="magic-school">{{ school }}</span>
    </div>
    <div
      v-if="!isShout"
      class="magic-cost"
    >
      <span>{{ cost }}</span><span class="cost-label"> MP</span>
    </div>
    <div
      v-else
      class="shout-ready"
    >
      Ready
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  school: string;
  cost: number;
  isShout?: boolean;
}>();
</script>

<style scoped lang="scss">
.magic-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: rgb(50 100 168 / 8%);
    border-color: #3264a8;
  }

  &.is-shout {
    border-left: 3px solid var(--skyrim-accent-gold);

    &:hover {
      background-color: rgb(201 162 39 / 8%);
      border-color: var(--skyrim-accent-gold-dim);
    }

    .magic-icon svg {
      color: var(--skyrim-accent-gold);
    }
  }
}

.magic-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;

  & svg {
    width: 20px;
    height: 20px;
    color: #5080c0;
  }
}

.magic-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.magic-name {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);
}

.magic-school {
  font-size: var(--font-size-xs);
  color: var(--skyrim-text-secondary);
}

.magic-cost {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: #5080c0;
}

.cost-label {
  font-size: var(--font-size-xs);
}

.shout-ready {
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-accent-gold);
  padding: var(--spacing-xs) var(--spacing-sm);
  background-color: var(--skyrim-bg-dark);
  border-radius: var(--radius-sm);
}
</style>
