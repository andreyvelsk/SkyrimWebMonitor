<template>
  <the-magic-school
    :spells-list="destructionList"
    :empty-message="$t('pages.magic.destruction.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from './TheMagicSchool.vue';

const magicStore = useMagicStore();
const { destructionList } = storeToRefs(magicStore);
</script>
