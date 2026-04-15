<template>
  <div class="inventory-list">
    <div class="list-wrapper">
      <div class="list">
        <!-- Items list -->
        <template v-if="items && items.length > 0">
          <slot
            v-for="(item, index) in items"
            :key="item.formId || index"
            :item="item"
            :active="modelValue === item.formId"
            :on-select="() => handleItemClick(item.formId)"
          />
        </template>

        <!-- Empty state -->
        <div v-else class="no-data">
          <slot name="empty">
            {{ emptyMessage }}
          </slot>
        </div>
      </div>

      <!-- Action toolbar -->
      <div class="inventory-toolbar">
        <button
          v-for="action in enabledActions"
          :key="action.id"
          class="toolbar-btn"
          :class="[
            action.class,
            { favorite: action.id === 'favorite' && isActiveItemFavorite },
          ]"
          :title="action.title"
          :disabled="!modelValue"
          @click="handleActionClick(action.event)"
        >
          <base-icon :icon-path="action.icon" :size="20" />
        </button>
      </div>
    </div>

    <div class="item-preview">
      <slot name="preview">
        <!-- Optional preview content goes here -->
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import type { InventoryItem } from '@/stores/inventory/types';

interface ToolbarAction {
  id: string;
  event: string;
  icon: string;
  title: string;
  class?: string;
}

interface Props {
  modelValue?: string | null;
  items: InventoryItem[];
  emptyMessage?: string;
  actions?: ToolbarAction[];
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  emptyMessage: () => '...',
  actions: () => [
    {
      id: 'favorite',
      event: 'favorite',
      icon: 'delapouite/round-star.svg',
      title: 'Add to favorites',
    },
    {
      id: 'drop',
      event: 'drop',
      icon: 'delapouite/trash-can.svg',
      title: 'Drop item',
    },
  ],
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  favorite: [];
  drop: [];
  'item-double-click': [formId: string];
}>();

const activeItemData = computed(() => {
  if (!props.modelValue) return null;
  return props.items?.find((item) => item.formId === props.modelValue) || null;
});

const isActiveItemFavorite = computed(() => {
  return activeItemData.value?.isFavorite || false;
});

const enabledActions = computed(() => {
  return props.actions || [];
});

function handleItemClick(formId: string) {
  if (props.modelValue !== formId) {
    // First click on new item - select it
    emit('update:modelValue', formId);
  } else {
    // Repeat click on already selected item - trigger action
    emit('item-double-click', formId);
  }
}

function handleActionClick(actionEvent: string) {
  if (actionEvent === 'favorite') {
    emit('favorite');
  } else if (actionEvent === 'drop') {
    emit('drop');
  }
}
</script>

<style scoped lang="scss">
.inventory-list {
  display: flex;
  flex-direction: row;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: var(--spacing-md);
}

.list-wrapper {
  flex: 0 0 60%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.list {
  min-width: 0;
  overflow: hidden auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.item-preview {
  flex: 1 1 0%;
  min-width: 0;
  overflow: hidden;
}

.no-data {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--skyrim-text-secondary);
  font-size: 0.9rem;
}

.inventory-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  --skyrim-text-accent: var(--skyrim-text-secondary);

  &:hover:not(:disabled) {
    background-color: var(--tab-bg-hover);
    border-color: var(--skyrim-accent-gold-dim);

    --skyrim-text-accent: var(--skyrim-text-primary);
  }

  &:active:not(:disabled) {
    background-color: var(--tab-bg-active);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
    border-color: var(--skyrim-border-dark);
  }

  &.favorite {
    --skyrim-text-accent: var(--skyrim-accent-gold);

    &:hover:not(:disabled) {
      --skyrim-text-accent: var(--skyrim-accent-gold);
    }
  }
}
</style>
