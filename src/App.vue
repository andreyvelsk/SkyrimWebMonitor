<template>
  <div class="handheld-device">
    <div class="ornament-corner top-left" />
    <div class="ornament-corner top-right" />
    <div class="ornament-corner bottom-left" />
    <div class="ornament-corner bottom-right" />

    <skyrim-navigation
      :tabs="tabs"
      :active-tab="activeTab"
      :active-sub-tab="activeSubTab"
      @tab-change="handleTabChange"
      @subtab-change="handleSubTabChange"
    />

    <main class="content-area">
      <skyrim-content
        :tab="activeTab"
        :sub-tab="activeSubTab"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import SkyrimNavigation from './components/SkyrimNavigation.vue';
import SkyrimContent from './components/SkyrimContent.vue';

interface SubTab { id: string; label: string }
interface Tab    { id: string; label: string; subTabs: SubTab[] }

const tabs = ref<Tab[]>([
  {
    id: 'character', label: 'Character',
    subTabs: [
      { id: 'stats',   label: 'Stats'   },
      { id: 'skills',  label: 'Skills'  },
      { id: 'perks',   label: 'Perks'   },
      { id: 'status',  label: 'Status'  }
    ]
  },
  {
    id: 'inventory', label: 'Inventory',
    subTabs: [
      { id: 'weapons', label: 'Weapons' },
      { id: 'armor',   label: 'Armor'   },
      { id: 'potions', label: 'Potions' },
      { id: 'misc',    label: 'Misc'    }
    ]
  },
  {
    id: 'magic', label: 'Magic',
    subTabs: [
      { id: 'spells',  label: 'Spells'  },
      { id: 'powers',  label: 'Powers'  },
      { id: 'shouts',  label: 'Shouts'  }
    ]
  },
  {
    id: 'map', label: 'Map',
    subTabs: [
      { id: 'local',   label: 'Local'   },
      { id: 'world',   label: 'World'   },
      { id: 'quests',  label: 'Quests'  }
    ]
  }
]);

const activeTab    = ref('character');
const activeSubTab = ref('stats');

const handleTabChange = (tabId: string) => {
  activeTab.value = tabId;
  const tab = tabs.value.find(t => t.id === tabId);
  if (tab?.subTabs.length) activeSubTab.value = tab.subTabs[0].id;
};

const handleSubTabChange = (subTabId: string) => {
  activeSubTab.value = subTabId;
};
</script>

<style scoped>
.content-area {
  flex: 1;
  overflow-y: auto;
}
</style>
