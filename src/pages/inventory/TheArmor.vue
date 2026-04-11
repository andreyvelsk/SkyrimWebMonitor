<template>
  <div class="list">
    <!-- Show apparel if data is available -->
    <template v-if="apparel.items && apparel.items.length > 0">
      <inventory-item
        v-for="(item, index) in apparel.items"
        :key="(item as Record<string, any>).id || (item as Record<string, any>).formId || index"
        :name="(item as Record<string, any>).name || $t('pages.inventory.apparel.unknown')"
        :description="(item as Record<string, any>).description || $t('pages.inventory.apparel.noDescription')"
        :equipped="(item as Record<string, any>).equipped || false"
      />
    </template>
    <!-- Fallback to placeholder when no data -->
    <div
      v-else
      class="no-data"
    >
      {{ $t('pages.inventory.apparel.waitingForData') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { InventoryItem } from '@/shared/ui';
import { useInventoryStore } from '@/stores/inventory/useInventoryStore';

const inventoryStore = useInventoryStore();
const { apparel } = storeToRefs(inventoryStore);
</script>

<style scoped lang="scss">
.no-data {
  padding: var(--spacing-md);
  text-align: center;
  color: var(--skyrim-text-muted);
  font-size: 0.9rem;
}
</style>

