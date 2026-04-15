<template>
  <div class="list">
    <!-- Show apparel if data is available -->
    <template v-if="apparel.items && apparel.items.length > 0">
      <apparel-item
        v-for="(item, index) in apparel.items"
        :key="item.formId || index"
        :name="item.name || $t('pages.inventory.apparel.unknown')"
        :apparel-type="item.armorType"
        :quantity="item.count"
        :is-equipped="item.isEquipped || false"
      />
    </template>
    <!-- Fallback to placeholder when no data -->
    <div v-else class="no-data">
      {{ $t('pages.inventory.apparel.waitingForData') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ApparelItem } from '@/entities/ui';
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
