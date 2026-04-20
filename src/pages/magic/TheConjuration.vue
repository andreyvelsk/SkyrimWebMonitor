<template>
  <the-magic-school
    :spells-list="conjurationList"
    :empty-message="$t('pages.magic.conjuration.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from './TheMagicSchool.vue';

const magicStore = useMagicStore();
const { conjurationList } = storeToRefs(magicStore);
</script>
