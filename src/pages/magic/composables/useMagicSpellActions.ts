import { ref, computed, watch } from 'vue';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { useHotkeysStore } from '@/stores/hotkeys/useHotkeysStore';
import { HandPicker, HotkeyPickerModal } from '@/shared/ui';
import type { SpellItem } from '@/stores/magic/types';
import type { EquipSlot } from '@/shared/lib/types/common';
import type { HotkeySlot } from '@/api/websocket';
import { isMasterLevelSpell } from '@/stores/magic/helpers';

export function useMagicSpellActions(spellsList: () => SpellItem[]) {
  const wsStore = useWebSocketStore();
  const hotkeysStore = useHotkeysStore();
  const { closeModal, openModal } = useModal();

  const activeSpell = ref<string | null>(null);

  const activeSpellData = computed(() => {
    if (!activeSpell.value) return null;
    return spellsList().find(spell => spell.formId === activeSpell.value) || null;
  });

  function equipSpell(formId: string) {
    const spell = spellsList().find((s) => s.formId === formId);
    if (!spell) return;

    // Master-level spells are always dual-cast
    if (isMasterLevelSpell(spell)) {
      if (spell.isEquipped) {
        // Unequip from right hand (master spells unequip from both hands)
        wsStore.sendCommand({ command: 'unequip_spell', formId, hand: 'right' });
      } else {
        // Equip to right hand (will be dual-cast automatically)
        wsStore.sendCommand({ command: 'equip_spell', formId, hand: 'right' });
      }
      return;
    }

    // If already equipped
    if (spell.isEquipped) {
      // If dual-cast, show hand picker to switch hand or unequip
      if (spell.equippedHand === 'both') {
        openModal({
          component: HandPicker,
          props: {
            equippedHand: spell.equippedHand,
            mode: 'equipped',
          },
          on: {
            selectHand: (hand: EquipSlot) => {
              // Unequip from one hand
              wsStore.sendCommand({ command: 'unequip_spell', formId, hand });
              closeModal();
            },
          },
        });
        return;
      }

      // If single-handed, show picker to switch or unequip
      openModal({
        component: HandPicker,
        props: {
          equippedHand: spell.equippedHand,
          mode: 'equipped',
        },
        on: {
          selectHand: (hand: EquipSlot) => {
            if (hand === spell.equippedHand) {
              // Unequip from current hand
              wsStore.sendCommand({ command: 'unequip_spell', formId, hand });
            } else {
              // Equip to other hand (will dual-cast if already equipped in one)
              wsStore.sendCommand({ command: 'equip_spell', formId, hand });
            }
            closeModal();
          },
        },
      });
      return;
    }

    // If not equipped, show hand picker modal
    openModal({
      component: HandPicker,
      props: {
        mode: 'equip',
      },
      on: {
        selectHand: (hand: EquipSlot) => {
          wsStore.sendCommand({ command: 'equip_spell', formId, hand });
          closeModal();
        },
      },
    });
  }

  function toggleFavorite() {
    if (!activeSpell.value) return;
    wsStore.sendCommand({ command: 'favorite_spell', formId: activeSpell.value });
  }

  function openHotkeyPicker() {
    if (!activeSpell.value || !activeSpellData.value) return;
    const formId = activeSpell.value;
    const currentSlot = hotkeysStore.getSlotForFormId(formId);

    openModal({
      component: HotkeyPickerModal,
      props: {
        currentSlot,
        itemName: activeSpellData.value.name,
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
  }

  // Automatically select the first spell when the spells list becomes available
  watch(
    () => spellsList(),
    (newList) => {
      if (!activeSpell.value && newList && newList.length > 0) {
        activeSpell.value = newList[0].formId;
      }
    },
    { immediate: true }
  );

  return {
    activeSpell,
    activeSpellData,
    equipSpell,
    toggleFavorite,
    openHotkeyPicker,
  };
}
