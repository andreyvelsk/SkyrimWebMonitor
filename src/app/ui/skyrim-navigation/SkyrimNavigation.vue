<template>
  <header class="navigation-header">
    <div class="tab-bar-row">
      <!-- Main sections: inactive tabs show only an icon, the active one
           expands to reveal its name. -->
      <nav
        class="cat-strip cat-strip--main animate-fade-in"
        role="tablist"
        :aria-label="$t('app.navigation.mainAriaLabel')"
      >
        <button
          v-for="tab in nav.tabs"
          :key="tab.id"
          type="button"
          class="cat-strip__item"
          :class="{ 'cat-strip__item--active': nav.activeTab === tab.id }"
          role="tab"
          :aria-selected="nav.activeTab === tab.id"
          :aria-label="tab.label"
          @click="nav.setActiveTab(tab.id)"
        >
          <base-icon
            :icon-path="TAB_ICONS[tab.id] ?? 'lorc/cog.svg'"
            :size="20"
            :background-color="nav.activeTab === tab.id ? 'var(--skyrim-accent-main)' : 'var(--skyrim-text-dim)'"
          />
          <span
            v-if="nav.activeTab === tab.id"
            class="cat-strip__label"
          >{{ tab.label }}</span>
        </button>
      </nav>

      <button
        type="button"
        class="settings-button"
        :aria-label="$t('app.settings.open')"
        @click="openSettings"
      >
        <base-icon
          icon-path="lorc/cog.svg"
          :background-color="'var(--skyrim-text-secondary)'"
        />
      </button>
    </div>

    <!-- Sub-tabs of the current section: same icon-strip behaviour. -->
    <nav
      v-if="visibleSubTabs.length > 0"
      class="cat-strip cat-strip--sub animate-fade-in"
      role="tablist"
      :aria-label="$t('app.navigation.subAriaLabel')"
    >
      <button
        v-for="sub in visibleSubTabs"
        :key="sub.id"
        type="button"
        class="cat-strip__item"
        :class="{ 'cat-strip__item--active': nav.activeSubTab === sub.id }"
        role="tab"
        :aria-selected="nav.activeSubTab === sub.id"
        :aria-label="getSubtabLabel(sub)"
        @click="nav.setActiveSubTab(sub.id)"
      >
        <base-icon
          :icon-path="SUBTAB_ICONS[sub.id.toLowerCase()] ?? 'lorc/cog.svg'"
          :size="20"
          :background-color="nav.activeSubTab === sub.id ? 'var(--skyrim-accent-main)' : 'var(--skyrim-text-dim)'"
        />
        <span
          v-if="nav.activeSubTab === sub.id"
          class="cat-strip__label"
        >{{ getSubtabLabel(sub) }}</span>
      </button>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseIcon } from '@/shared/ui';
import { MAGIC_SCHOOL_ICON_PATHS } from '@/shared/lib/constants/magicSchoolIcons';
import { useModal } from '@/shared/lib';
import { SettingsModalContent } from '@/features/settings';
import { useNavigationStore } from '@/stores/use-navigation-store/useNavigationStore';
import type { SubTab } from '@/stores/use-navigation-store/lib/types';

const nav = useNavigationStore();
const { t } = useI18n();
const { openModal } = useModal();

const visibleSubTabs = computed(() => nav.getVisibleSubTabs());

/** Icons for the main sections (top strip). */
const TAB_ICONS: Record<string, string> = {
  character: 'delapouite/person.svg',
  inventory: 'lorc/knapsack.svg',
  magic: 'lorc/magic-swirl.svg',
  quests: 'delapouite/newspaper.svg',
  map: 'lorc/treasure-map.svg',
};

/** Icons for the sub-tabs (bottom strip). */
const SUBTAB_ICONS: Record<string, string> = {
  // Character
  stats: 'delapouite/histogram.svg',
  hotkeys: 'delapouite/keyboard.svg',
  // Inventory
  weapons: 'lorc/crossed-swords.svg',
  apparel: 'lorc/lamellar.svg',
  potions: 'lorc/potion-ball.svg',
  scrolls: 'lorc/tied-scroll.svg',
  food: 'lorc/shiny-apple.svg',
  ingredients: 'skoll/pestle-mortar.svg',
  books: 'lorc/open-book.svg',
  keys: 'lorc/key.svg',
  misc: 'lorc/swap-bag.svg',
  // Magic
  destruction: MAGIC_SCHOOL_ICON_PATHS.Destruction,
  alteration: MAGIC_SCHOOL_ICON_PATHS.Alteration,
  conjuration: MAGIC_SCHOOL_ICON_PATHS.Conjuration,
  illusion: MAGIC_SCHOOL_ICON_PATHS.Illusion,
  restoration: MAGIC_SCHOOL_ICON_PATHS.Restoration,
  enchanting: 'lorc/crystal-wand.svg',
  shouts: MAGIC_SCHOOL_ICON_PATHS.Shouts,
  spellbook: 'lorc/book-aura.svg',
  powers: 'lorc/embrassed-energy.svg',
  // Quests
  questslist: 'lorc/scroll-unfurled.svg',
};

function getSubtabLabel(sub: SubTab) {
  if (nav.activeTab === 'magic') {
    return sub.label;
  }
  return t(`app.tabs.${nav.activeTab}.subtabs.${sub.id}`);
}

function openSettings(): void {
  openModal({ component: SettingsModalContent });
}
</script>

<style scoped lang="scss">
/*
 * Top bar: main sections (top strip) and the sub-tabs of the current
 * section (bottom strip) + settings. Both strips use the icon-strip
 * pattern: inactive tabs show only an icon, the active one expands to
 * reveal its name and gets an accent underline.
 */

.navigation-header {
  flex-shrink: 0;
  background-color: var(--skyrim-bg-medium);
  position: relative;
  z-index: var(--z-sticky);
}

.tab-bar-row {
  display: flex;
  align-items: stretch;
  min-height: 40px;
  background-color: var(--skyrim-bg-dark);
  border-bottom: 2px solid var(--skyrim-border-dark);
  box-sizing: border-box;
}

.cat-strip {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  min-width: 0;
  min-height: 40px;
  padding-inline: var(--spacing-sm);
  background-color: var(--skyrim-bg-dark);
}

.cat-strip--sub {
  border-bottom: 2px solid var(--skyrim-border-dark);
}


.cat-strip__item {
  position: relative;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  padding: 0 2px;
  background: none;
  border: none;
  cursor: pointer;
  touch-action: manipulation;
  transition: flex-grow var(--transition-normal);

  /* The active category expands to show its name. */
  &--active {
    flex-grow: 2.6;

    &::after {
      background: var(--skyrim-accent-main);
    }
  }
}

.cat-strip__label {
  overflow: hidden;
  font-family: var(--font-heading);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--skyrim-text-primary);
}

.settings-button {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding-inline: var(--spacing-sm)
    max(var(--spacing-sm), env(safe-area-inset-right));
  background-color: transparent;
  border: none;
  border-left: 1px solid var(--skyrim-border-dark);
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color var(--transition-normal);

  @media (hover: hover) {
    &:hover {
      background-color: var(--tab-bg-hover);
    }
  }

  &:active {
    background-color: var(--tab-bg-active);
    transition: none;
  }
}
</style>
