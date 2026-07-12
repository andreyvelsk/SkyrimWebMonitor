import { ref, computed, watch } from 'vue';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { useHotkeysStore } from '@/stores/hotkeys/useHotkeysStore';
import { DataRouter } from '@/stores/adapters/dataRouter';
import { HotkeyPickerModal } from '@/shared/ui';
import type { ShoutItem } from '@/stores/magic/types';
import type { HotkeySlot } from '@/api/websocket';

export function useMagicShoutActions(shoutsList: () => ShoutItem[]) {
  const wsStore = useWebSocketStore();
  const hotkeysStore = useHotkeysStore();
  const { closeModal, openModal } = useModal();

  const activeShout = ref<string | null>(null);

  const activeShoutData = computed(() => {
    if (!activeShout.value) return null;
    return shoutsList().find((s) => s.formId === activeShout.value) || null;
  });

  function equipShout(formId: string) {
    const shout = shoutsList().find((s) => s.formId === formId);
    if (!shout) return;

    if (shout.isEquipped) {
      wsStore.sendCommand({ command: 'unequip_shout', formId });
    } else {
      wsStore.sendCommand({ command: 'equip_shout', formId });
    }
  }

  function toggleFavorite() {
    if (!activeShout.value) return;
    wsStore.sendCommand({ command: 'favorite_shout', formId: activeShout.value });
  }

  function openHotkeyPicker() {
    if (!activeShout.value || !activeShoutData.value) return;
    const formId = activeShout.value;
    const itemName = activeShoutData.value.name;

    wsStore.sendQuery('hotkeys.items', { items: 'Hotkey::Items' }, (fields) => {
      DataRouter.routeDataById('hotkeys.items', fields);
      const currentSlot = hotkeysStore.getSlotForFormId(formId);

      openModal({
        component: HotkeyPickerModal,
        props: {
          currentSlot,
          itemName,
        },
        on: {
          select: (slot: HotkeySlot) => {
            const existing = hotkeysStore.getSlotForFormId(formId);
            if (existing === slot) {
              wsStore.sendCommand({ command: 'hotkey_clear', slot });
            } else {
              wsStore.sendCommand({ command: 'hotkey_set', formId, slot });
            }
            closeModal();
          },
        },
      });
    });
  }

  // Automatically select the first shout when the list becomes available
  watch(
    () => shoutsList(),
    (newList) => {
      if (!activeShout.value && newList && newList.length > 0) {
        activeShout.value = newList[0].formId;
      }
    },
    { immediate: true }
  );

  return {
    activeShout,
    activeShoutData,
    equipShout,
    toggleFavorite,
    openHotkeyPicker,
  };
}
