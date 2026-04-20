<template>
  <the-magic-school
    :spells-list="illusionList"
    :empty-message="$t('pages.magic.illusion.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from './TheMagicSchool.vue';

const magicStore = useMagicStore();
const { illusionList } = storeToRefs(magicStore);
</script>
