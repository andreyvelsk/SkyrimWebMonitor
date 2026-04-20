import { ref, computed, watch } from 'vue';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';
import { useModal } from '@/shared/lib/composables/useModal';
import { HandPicker } from '@/shared/ui';
import type { SpellItem } from '@/stores/magic/types';
import type { EquipSlot } from '@/shared/lib/types/common';
import { isMasterLevelSpell } from '@/stores/magic/helpers';

export function useMagicSpellActions(spellsList: () => SpellItem[]) {
  const wsStore = useWebSocketStore();
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
        wsStore.sendCommand('unequip_spell', formId, 'right');
      } else {
        // Equip to right hand (will be dual-cast automatically)
        wsStore.sendCommand('equip_spell', formId, 'right');
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
              wsStore.sendCommand('unequip_spell', formId, hand);
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
              wsStore.sendCommand('unequip_spell', formId, hand);
            } else {
              // Equip to other hand (will dual-cast if already equipped in one)
              wsStore.sendCommand('equip_spell', formId, hand);
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
          wsStore.sendCommand('equip_spell', formId, hand);
          closeModal();
        },
      },
    });
  }

  function toggleFavorite() {
    if (!activeSpell.value) return;
    wsStore.sendCommand('favorite_spell', activeSpell.value);
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
  };
}
