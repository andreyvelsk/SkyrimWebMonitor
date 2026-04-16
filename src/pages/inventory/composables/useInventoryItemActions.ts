import { ref, computed, watch } from 'vue';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { DropItemsModal } from '@/shared/ui';
import type { InventoryItem } from '@/stores/inventory/types';

export function useInventoryItemActions(itemsList: () => InventoryItem[]) {
  const wsStore = useWebSocketStore();
  const { closeModal, openModal } = useModal();

  const activeItem = ref<string | null>(null);

  const activeItemData = computed(() => {
    if (!activeItem.value) return null;
    return itemsList().find(item => item.formId === activeItem.value) || null;
  });

  function toggleFavorite() {
    if (!activeItem.value) return;
    wsStore.sendCommand('favorite', activeItem.value);
  }

  function startDrop() {
    if (!activeItemData.value || !activeItem.value) return;

    const count = activeItemData.value.count;

    // If more than 5 items, show modal for quantity selection
    if (count > 5) {
      openModal({
        component: DropItemsModal,
        props: {
          maxCount: count,
        },
        on: {
          drop: (qty: number) => {
            wsStore.sendCommand('drop', activeItem.value!, undefined, qty);
            closeModal();
          },
        },
      });
      return;
    }

    // If 5 or fewer, drop one
    wsStore.sendCommand('drop', activeItem.value, undefined, 1);
  }

  // Automatically select the first item when the items list becomes available
  watch(
    () => itemsList(),
    (newList) => {
      if (!activeItem.value && newList && newList.length > 0) {
        activeItem.value = newList[0].formId;
      }
    },
    { immediate: true }
  );

  return {
    activeItem,
    activeItemData,
    toggleFavorite,
    startDrop,
  };
}
