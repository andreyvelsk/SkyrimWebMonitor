<template>
  <div class="skyrim-weapons">
    <div class="list-wrapper">
      <div class="list">
        <!-- Show weapons if data is available -->
        <template v-if="weapons.items && weapons.items.length > 0">
          <inventory-item
            v-for="(item, index) in weapons.items"
            :key="item.formId || index"
            :name="item.name || $t('pages.inventory.weapons.unknown')"
            :equipped="item.isEquipped || false"
            :class="{ active: activeItem === item.formId }"
            @click="setActiveItem(item.formId)"
          />
        </template>
        <!-- Fallback to placeholder when no data -->
        <div
          v-else
          class="no-data"
        >
          {{ $t('pages.inventory.weapons.waitingForData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref }  from 'vue';
import { storeToRefs } from 'pinia';
import { InventoryItem } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';

const inventoryStore = useInventoryStore();
const { weapons } = storeToRefs(inventoryStore);
const wsStore = useWebSocketStore();

const activeItem = ref<string | null>(null);

function setActiveItem(formId: string) {
  if (activeItem.value !== formId) {
    activeItem.value = formId;
    return;
  }

  const item = weapons.value.items?.find(w => w.formId === formId);
  if (!item) return;

  const action = item.isEquipped ? 'unequip' : 'equip';
  wsStore.sendCommand(action, formId, { hand: 'right' });
}
</script>

<style scoped lang="scss">
.skyrim-weapons {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  gap: var(--spacing-md);
}

.list-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.no-data {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--skyrim-text-muted);
  font-size: 0.9rem;
}

.drop-button {
  flex-shrink: 0;
  padding: var(--spacing-md);
  margin: 0 var(--spacing-md) var(--spacing-md) var(--spacing-md);
  font-family: var(--font-heading);
  font-size: var(--font-size-sm);
  color: var(--skyrim-text-primary);
  background-color: var(--skyrim-bg-light);
  border: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background-color: rgb(201 162 39 / 8%);
    border-color: var(--skyrim-accent-gold-dim);
  }
}
</style>
