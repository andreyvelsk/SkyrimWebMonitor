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
          >
            <inventory-item
              v-if="'name' in item && 'isFavorite' in item"
              :name="item.name || $t('shared.ui.inventoryItem.unknown')"
              :is-favorite="item.isFavorite"
              :active="modelValue === item.formId"
              :quantity="'count' in item ? item.count : 0"
              @click="handleItemClick(item.formId)"
            />
          </slot>
        </template>

        <!-- Empty state -->
        <div
          v-else
          class="no-data"
        >
          <slot name="empty">
            {{ emptyMessage }}
          </slot>
        </div>
      </div>

      <!-- Action toolbar -->
      <div class="inventory-toolbar">
        <template
          v-for="(actionItem, index) in enabledActions"
          :key="index"
        >
          <div
            v-if="isActionGroup(actionItem)"
            class="d-flex gap-sm"
          >
            <button
              v-for="action in actionItem.group"
              :key="action.id"
              class="btn btn-icon toolbar-btn"
              :class="[
                action.class,
                { favorite: action.id === 'favorite' && isActiveItemFavorite },
              ]"
              :disabled="!modelValue"
              @click="handleActionClick(action.event)"
            >
              <base-icon
                :icon-path="action.icon"
                :size="20"
              />
            </button>
          </div>
          <button
            v-else
            class="btn btn-icon toolbar-btn"
            :class="[
              actionItem.class,
              {
                favorite: actionItem.id === 'favorite' && isActiveItemFavorite,
              },
            ]"
            :disabled="!modelValue"
            @click="handleActionClick(actionItem.event)"
          >
            <base-icon
              :icon-path="actionItem.icon"
              :size="20"
            />
          </button>
        </template>
      </div>
    </div>

    <div class="item-preview">
      <slot name="preview">
        <!-- Optional preview content goes here -->
        <base-preview
          v-if="activeItem"
          :data="activeItem"
          :stats="activeItemStats"
          :effects="previewEffects"
        >
          <template #icon>
            <item-thumbnail
              v-if="activeInventoryItem"
              :fallback-icon-path="previewIconPath"
              :model-path="activeInventoryItem.modelPath"
              :keywords="activeInventoryItem.keywords"
              :framing="getItemFraming(activeInventoryItem)"
              :size="ITEM_PREVIEW_THUMBNAIL_SIZE"
              expandable
              :name="activeInventoryItem.name"
            />
            <base-icon
              v-else
              :icon-path="previewIconPath"
              :size="48"
            />
          </template>
        </base-preview>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseIcon } from '@/shared/ui';
import { InventoryItem, BasePreview  } from '@/shared/ui/items';
import { ItemThumbnail } from '@/entities/ui/icons';
import { ITEM_PREVIEW_THUMBNAIL_SIZE } from '@/shared/lib/constants/itemThumbnails';
import { getItemFraming } from '@/shared/lib/utils/itemVisual';
import type { InventoryItem as InventoryItemData } from '@/stores/inventory/lib/types';
import type { ItemEnchantmentEffect, ListItem } from '@/shared/lib/types';
import type { PreviewStats } from '@/shared/ui/items/lib/types';

interface ToolbarAction {
  id: string;
  event: string;
  icon: string;
  class?: string;
}

interface ToolbarActionGroup {
  group: ToolbarAction[];
}

type ToolbarActionItem = ToolbarAction | ToolbarActionGroup;

function isActionGroup(item: ToolbarActionItem): item is ToolbarActionGroup {
  return 'group' in item;
}

interface Props {
  modelValue?: string | null;
  items: ListItem[];
  emptyMessage?: string;
  actions?: ToolbarActionItem[];
  activeItem?: ListItem | null;
  activeItemStats?: PreviewStats[];
  previewEffects?: ItemEnchantmentEffect[];
  previewIconPath?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  emptyMessage: () => '...',
  actions: () => [
    {
      group: [
        {
          id: 'favorite',
          event: 'favorite',
          icon: 'delapouite/round-star.svg',
        },
        { id: 'hotkey', event: 'hotkey', icon: 'delapouite/keyboard.svg' },
      ],
    },
    { id: 'drop', event: 'drop', icon: 'delapouite/trash-can.svg' },
  ],
  activeItem: null,
  activeItemStats: () => [],
  previewEffects: () => [],
  previewIconPath: 'lorc/cog.svg',
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  favorite: [];
  drop: [];
  hotkey: [];
  'item-double-click': [formId: string];
}>();

const activeItemData = computed(() => {
  if (!props.modelValue) return null;
  return props.items?.find((item) => item.formId === props.modelValue) || null;
});

function isInventoryItem(item: ListItem): item is InventoryItemData {
  return 'categoryType' in item && 'count' in item && 'value' in item && 'weight' in item;
}

const activeInventoryItem = computed<InventoryItemData | null>(() => {
  const item = activeItemData.value;
  return item && isInventoryItem(item) ? item : null;
});

const isActiveItemFavorite = computed(() => {
  if (activeItemData.value && 'isFavorite' in activeItemData.value) {
    return activeItemData.value.isFavorite || false;
  }
  return false;
});

const enabledActions = computed((): ToolbarActionItem[] => {
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
  if (actionEvent === 'favorite') emit('favorite');
  else if (actionEvent === 'drop') emit('drop');
  else if (actionEvent === 'hotkey') emit('hotkey');
}
</script>

<style scoped lang="scss">
/*
 * Toolbar buttons use .btn .btn-icon from the design system; only
 * the colour-token override behaviour for nested icons (favorite /
 * hotkey states) is component-specific.
 */

.inventory-list {
  display: flex;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: var(--spacing-md);
}

.list-wrapper {
  flex: 0 0 var(--inventory-list-wrapper-width, 60%);
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
}

.item-preview {
  flex: 1 1 0%;
  min-width: 0;
  overflow: hidden;
}

.inventory-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.toolbar-btn {
  --skyrim-text-accent: var(--skyrim-text-secondary);

  @media (hover: hover) {
    &:hover:not(:disabled) {
      --skyrim-text-accent: var(--skyrim-text-primary);
    }

    &.favorite:hover:not(:disabled),
    &.hotkey-bound:hover:not(:disabled) {
      --skyrim-text-accent: var(--skyrim-accent-main);
    }
  }

  &.favorite,
  &.hotkey-bound {
    --skyrim-text-accent: var(--skyrim-accent-main);
  }
}
</style>
