<template>
  <base-preview
    :data="data"
    :stats="stats"
    :effects="data?.enchantment?.effects"
  >
    <template #icon>
      <weapon-icon
        v-if="data"
        :weapon-type="data.weaponType"
        :size="48"
      />
    </template>
  </base-preview>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BasePreview } from '@/shared/ui/items';
import { WeaponIcon } from '@/entities/ui';
import { getRoundValue } from '@/shared/lib/utils/getDescriptionValues';
import type { WeaponItem } from '@/stores/inventory/types';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    data?: WeaponItem | null;
  }>(),
  {
    data: null,
  }
);

const stats = computed(() => [
  {
    label: t('pages.inventory.weapons.damage'),
    value: getRoundValue(props.data?.damage ?? props.data?.baseDamage),
  },
  {
    label: t('pages.inventory.weapons.weight'),
    value: getRoundValue(props.data?.weight),
  },
  {
    label: t('pages.inventory.weapons.value'),
    value: getRoundValue(props.data?.value),
  },
]);
</script>
