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
      Active
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  description: string
  active?: boolean
  completed?: boolean
}>();
</script>

<style scoped>
.quest-item                    { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-md); background-color: var(--skyrim-bg-light); border: 1px solid var(--skyrim-border-dark); cursor: pointer; transition: all var(--transition-fast); }
.quest-item:hover              { background-color: rgba(201,162,39,0.08); border-color: var(--skyrim-accent-gold-dim); }
.quest-item.active             { border-left: 3px solid var(--skyrim-accent-gold); background-color: rgba(201,162,39,0.05); }
.quest-item.completed          { opacity: 0.6; }
.quest-marker                  { width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
.quest-marker svg              { width: 16px; height: 16px; color: var(--skyrim-text-secondary); }
.quest-item.active    .quest-marker svg { color: var(--skyrim-accent-gold); }
.quest-item.completed .quest-marker svg { color: var(--skyrim-accent-gold-dim); }
.quest-info                    { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.quest-name                    { font-family: var(--font-heading); font-size: var(--font-size-sm); color: var(--skyrim-text-primary); }
.quest-desc                    { font-size: var(--font-size-xs); color: var(--skyrim-text-secondary); }
.quest-badge                   { font-family: var(--font-heading); font-size: var(--font-size-xs); color: var(--skyrim-accent-gold); padding: 2px 8px; border: 1px solid var(--skyrim-border-accent); border-radius: var(--radius-sm); }
</style>
