<template>
  <the-magic-school
    :spells-list="alterationList"
    :empty-message="$t('pages.magic.alteration.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheMagicSchool from './TheMagicSchool.vue';

const magicStore = useMagicStore();
const { alterationList } = storeToRefs(magicStore);
</script>
