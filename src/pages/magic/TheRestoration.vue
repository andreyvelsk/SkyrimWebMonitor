<template>
  <the-magic-school
    :spells-list="restorationList"
    :empty-message="$t('pages.magic.restoration.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from './TheMagicSchool.vue';

const magicStore = useMagicStore();
const { restorationList } = storeToRefs(magicStore);
</script>
