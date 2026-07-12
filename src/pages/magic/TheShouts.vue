<template>
  <the-shouts-list
    :shouts-list="shoutsList"
    :empty-message="$t('pages.magic.shouts.waitingForData')"
  />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMagicStore } from '@/stores/magic/useCharacterSpellStore';
import TheShoutsList from './TheShoutsList.vue';

const magicStore = useMagicStore();
const { shoutsList } = storeToRefs(magicStore);
</script>
