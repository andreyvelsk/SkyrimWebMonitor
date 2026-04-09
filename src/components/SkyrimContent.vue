<template>
  <div
    :key="`${tab}-${subTab}`"
    class="skyrim-panel animate-slide-down"
  >
    <div class="ornament-corner top-left" />
    <div class="ornament-corner top-right" />
    <div class="ornament-corner bottom-left" />
    <div class="ornament-corner bottom-right" />

    <h2 class="skyrim-panel-header">
      {{ formatTitle(tab) }} — {{ formatTitle(subTab) }}
    </h2>

    <!-- character / stats -->
    <template v-if="tab === 'character' && subTab === 'stats'">
      <div class="stats-grid">
        <stat-bar
          label="Health"
          :value="85"
          :max="100"
          color="health"
        />
        <stat-bar
          label="Magicka"
          :value="60"
          :max="100"
          color="magicka"
        />
        <stat-bar
          label="Stamina"
          :value="72"
          :max="100"
          color="stamina"
        />
      </div>
      <div class="list">
        <attribute-row
          label="Level"
          value="24"
        />
        <attribute-row
          label="Experience"
          value="1,250 / 2,000"
        />
        <attribute-row
          label="Carry Weight"
          value="285 / 300"
        />
        <attribute-row
          label="Gold"
          value="4,567"
        />
      </div>
    </template>

    <!-- character / skills -->
    <template v-else-if="tab === 'character' && subTab === 'skills'">
      <div class="list">
        <skill-item
          name="One-Handed"
          :level="45"
        />
        <skill-item
          name="Destruction"
          :level="38"
        />
        <skill-item
          name="Heavy Armor"
          :level="52"
        />
        <skill-item
          name="Smithing"
          :level="67"
        />
        <skill-item
          name="Enchanting"
          :level="41"
        />
      </div>
    </template>

    <!-- inventory / weapons -->
    <template v-else-if="tab === 'inventory' && subTab === 'weapons'">
      <div class="list">
        <inventory-item
          name="Daedric Sword"
          description="Damage: 48"
          :equipped="true"
        />
        <inventory-item
          name="Elven Bow"
          description="Damage: 32"
        />
        <inventory-item
          name="Glass Dagger"
          description="Damage: 18"
        />
        <inventory-item
          name="Steel Greatsword"
          description="Damage: 26"
        />
      </div>
    </template>

    <!-- inventory / armor -->
    <template v-else-if="tab === 'inventory' && subTab === 'armor'">
      <div class="list">
        <inventory-item
          name="Dragonscale Armor"
          description="Armor: 82"
          :equipped="true"
        />
        <inventory-item
          name="Ebony Helmet"
          description="Armor: 24"
          :equipped="true"
        />
        <inventory-item
          name="Glass Boots"
          description="Armor: 18"
        />
      </div>
    </template>

    <!-- inventory / potions -->
    <template v-else-if="tab === 'inventory' && subTab === 'potions'">
      <div class="list">
        <inventory-item
          name="Potion of Ultimate Healing"
          description="Restore 100 Health"
          :quantity="5"
        />
        <inventory-item
          name="Potion of Magicka"
          description="Restore 50 Magicka"
          :quantity="12"
        />
        <inventory-item
          name="Potion of Stamina"
          description="Restore 50 Stamina"
          :quantity="8"
        />
      </div>
    </template>

    <!-- magic / spells -->
    <template v-else-if="tab === 'magic' && subTab === 'spells'">
      <div class="list">
        <magic-item
          name="Fireball"
          school="Destruction"
          :cost="50"
        />
        <magic-item
          name="Healing Hands"
          school="Restoration"
          :cost="25"
        />
        <magic-item
          name="Oakflesh"
          school="Alteration"
          :cost="40"
        />
        <magic-item
          name="Conjure Flame Atronach"
          school="Conjuration"
          :cost="100"
        />
      </div>
    </template>

    <!-- magic / shouts -->
    <template v-else-if="tab === 'magic' && subTab === 'shouts'">
      <div class="list">
        <magic-item
          name="Unrelenting Force"
          school="Fus Ro Dah"
          :cost="0"
          :is-shout="true"
        />
        <magic-item
          name="Fire Breath"
          school="Yol Toor Shul"
          :cost="0"
          :is-shout="true"
        />
        <magic-item
          name="Whirlwind Sprint"
          school="Wuld Nah Kest"
          :cost="0"
          :is-shout="true"
        />
      </div>
    </template>

    <!-- map / quests -->
    <template v-else-if="tab === 'map' && subTab === 'quests'">
      <div class="list">
        <quest-item
          name="The Way of the Voice"
          description="Speak to the Greybeards"
          :active="true"
        />
        <quest-item
          name="The Golden Claw"
          description="Return the claw to Lucan"
        />
        <quest-item
          name="Bleak Falls Barrow"
          description="Retrieve the Dragonstone"
          :completed="true"
        />
      </div>
    </template>

    <!-- Все прочие комбинации -->
    <template v-else>
      <div class="empty-state">
        <p style="color: var(--skyrim-text-secondary)">
          Select an option to view details
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import StatBar from './StatBar.vue';
import AttributeRow from './AttributeRow.vue';
import SkillItem from './SkillItem.vue';
import InventoryItem from './InventoryItem.vue';
import MagicItem from './MagicItem.vue';
import QuestItem from './QuestItem.vue';

defineProps<{ tab: string; subTab: string }>();

const formatTitle = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<style scoped>
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
