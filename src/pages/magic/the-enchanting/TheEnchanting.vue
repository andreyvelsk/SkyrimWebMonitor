<template>
  <the-magic-school
    :spells-list="enchantingList"
    :empty-message="$t('pages.magic.enchanting.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from '../the-magic-school/TheMagicSchool.vue';

const magicStore = useMagicStore();
const { enchantingList } = storeToRefs(magicStore);
</script>
