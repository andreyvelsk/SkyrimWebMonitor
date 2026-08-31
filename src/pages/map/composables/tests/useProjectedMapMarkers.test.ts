import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';
import { useProjectedMapMarkers } from '@/pages/map/composables/useProjectedMapMarkers';
import { useGfxIconsStore } from '@/stores/gfx-icons/useGfxIconsStore';
import { QUEST_MARKER_EXTERIOR_SHAPE_ID, QUEST_MARKER_INTERIOR_SHAPE_ID } from '@/pages/map/composables/useMapMarkerIcons';
import type { MapQuestMarker } from '@/stores/map/lib/types';

// =============================================================
// Projected Map Markers tests
// =============================================================

describe('useProjectedMapMarkers', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('questObjectiveMarkers', () => {
    it('uses GFX icon when exterior shape (139) is loaded', () => {
      // Setup GFX store with exterior quest shape loaded
      const gfxStore = useGfxIconsStore();
      gfxStore.setIcons({
        [QUEST_MARKER_EXTERIOR_SHAPE_ID]: '<svg xmlns="http://www.w3.org/2000/svg"/>'
      });

      // Mock projection function that returns the same coordinates
      const projectWorldToImage = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y,
        u: point.x,
        v: point.y
      });

      // Sample quest marker (exterior)
      const questMarker: MapQuestMarker = {
        aliasId: 0,
        cell: null,
        cellFormId: null,
        isInterior: false,
        name: 'Test Quest',
        objectiveIndex: 0,
        objectiveText: 'Test Objective',
        objectiveTextResolved: 'Test Objective Resolved',
        parentWorldspace: null,
        parentWorldspaceFormId: null,
        questEditorId: 'TEST_QUEST',
        questFormId: '00012345',
        questName: 'Test Quest',
        questType: 'Main',
        refId: '00067890',
        worldspace: 'Tamriel',
        worldspaceFormId: '00012345',
        x: 100,
        y: 200,
        z: 0
      };

      const { questObjectiveMarkers } = useProjectedMapMarkers({
        projectWorldToImage,
        hotspots: ref([]),
        questMarkers: ref([questMarker]),
        questIconUrl: 'fallback-icon-url.png',
        currentWorldspace: 'Tamriel'
      });

      // Should use GFX icon when available
      expect(questObjectiveMarkers.value[0]?.iconUrl).toContain('data:image/svg+xml,');
    });

    it('uses GFX icon when interior shape (141) is loaded', () => {
      // Setup GFX store with interior quest shape loaded
      const gfxStore = useGfxIconsStore();
      gfxStore.setIcons({
        [QUEST_MARKER_INTERIOR_SHAPE_ID]: '<svg xmlns="http://www.w3.org/2000/svg"/>'
      });

      // Mock projection function that returns the same coordinates
      const projectWorldToImage = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y,
        u: point.x,
        v: point.y
      });

      // Sample quest marker (interior)
      const questMarker: MapQuestMarker = {
        aliasId: 0,
        cell: null,
        cellFormId: null,
        isInterior: true,
        name: 'Test Quest',
        objectiveIndex: 0,
        objectiveText: 'Test Objective',
        objectiveTextResolved: 'Test Objective Resolved',
        parentWorldspace: null,
        parentWorldspaceFormId: null,
        questEditorId: 'TEST_QUEST',
        questFormId: '00012345',
        questName: 'Test Quest',
        questType: 'Main',
        refId: '00067890',
        worldspace: 'Tamriel',
        worldspaceFormId: '00012345',
        x: 100,
        y: 200,
        z: 0
      };

      const { questObjectiveMarkers } = useProjectedMapMarkers({
        projectWorldToImage,
        hotspots: ref([]),
        questMarkers: ref([questMarker]),
        questIconUrl: 'fallback-icon-url.png',
        currentWorldspace: 'Tamriel'
      });

      // Should use GFX icon when available
      expect(questObjectiveMarkers.value[0]?.iconUrl).toContain('data:image/svg+xml,');
    });

    it('falls back to questIconUrl when GFX shapes are not loaded', () => {
      // Setup GFX store empty (no shapes loaded)
      const gfxStore = useGfxIconsStore();
      gfxStore.setIcons({});

      // Mock projection function that returns the same coordinates
      const projectWorldToImage = (point: { x: number; y: number }) => ({
        x: point.x,
        y: point.y,
        u: point.x,
        v: point.y
      });

      // Sample quest marker
      const questMarker: MapQuestMarker = {
        aliasId: 0,
        cell: null,
        cellFormId: null,
        isInterior: false,
        name: 'Test Quest',
        objectiveIndex: 0,
        objectiveText: 'Test Objective',
        objectiveTextResolved: 'Test Objective Resolved',
        parentWorldspace: null,
        parentWorldspaceFormId: null,
        questEditorId: 'TEST_QUEST',
        questFormId: '00012345',
        questName: 'Test Quest',
        questType: 'Main',
        refId: '00067890',
        worldspace: 'Tamriel',
        worldspaceFormId: '00012345',
        x: 100,
        y: 200,
        z: 0
      };

      const fallbackUrl = 'fallback-icon-url.png';
      const { questObjectiveMarkers } = useProjectedMapMarkers({
        projectWorldToImage,
        hotspots: ref([]),
        questMarkers: ref([questMarker]),
        questIconUrl: fallbackUrl,
        currentWorldspace: 'Tamriel'
      });

      // Should fall back to provided questIconUrl
      expect(questObjectiveMarkers.value[0]?.iconUrl).toBe(fallbackUrl);
    });
  });
});