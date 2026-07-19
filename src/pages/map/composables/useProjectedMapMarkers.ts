import { computed, type Ref } from 'vue';
import type { MapHotspot, MapQuestMarker } from '@/stores/map/types';
import type {
  LocationProjectedMarker,
  ProjectedMarker,
  QuestProjectedMarker,
} from '../types';
import { resolveMarkerIcon } from './useMapMarkerIcons';
import type { MapProjectionFn } from './useMapProjection';

interface UseProjectedMapMarkersOptions {
  projectWorldToImage: MapProjectionFn;
  hotspots: Ref<MapHotspot[]>;
  questMarkers: Ref<MapQuestMarker[]>;
  questIconUrl: string;
  /** Worldspace of the currently active map (e.g. "Tamriel", "DLC2SolstheimWorld"). */
  currentWorldspace: string;
}

const EXCLUDED_HOTSPOT_TYPES: string[] = [
  // 'DLC02ToSkyrim'
];

export function useProjectedMapMarkers({
  projectWorldToImage,
  hotspots,
  questMarkers,
  questIconUrl,
  currentWorldspace,
}: UseProjectedMapMarkersOptions) {
  const locationMarkers = computed<LocationProjectedMarker[]>(() => {
    return hotspots.value
      .filter((h) =>
        h.isVisible
        && EXCLUDED_HOTSPOT_TYPES.indexOf(h.type) === -1
    )
      .map((h) => {
        const projected = projectWorldToImage(h);
        if (!projected) return null;
        return {
          key: `location:${h.refId}`,
          kind: 'location',
          refId: h.refId,
          type: h.type,
          label: h.name,
          canFastTravel: h.canFastTravel,
          x: projected.x,
          y: projected.y,
          iconUrl: resolveMarkerIcon(h.type),
        } satisfies LocationProjectedMarker;
      })
      .filter(isProjectedMarker);
  });

  const questObjectiveMarkers = computed<QuestProjectedMarker[]>(() => {
    return questMarkers.value
      .filter(
        (marker) =>
          isRenderableQuestMarker(marker, currentWorldspace) &&
          Number.isFinite(marker.x) &&
          Number.isFinite(marker.y)
      )
      .map((marker) => {
        const projected = projectWorldToImage(marker);
        if (!projected) return null;
        return {
          key: `quest:${marker.questFormId}:${marker.objectiveIndex}:${marker.aliasId}:${marker.refId}`,
          kind: 'quest',
          refId: marker.refId,
          type: 'QuestObjective',
          label: marker.objectiveTextResolved || marker.name || marker.questName,
          canFastTravel: false,
          x: projected.x,
          y: projected.y,
          iconUrl: questIconUrl,
        } satisfies QuestProjectedMarker;
      })
      .filter(isProjectedMarker);
  });

  const markers = computed<ProjectedMarker[]>(() => [
    ...questObjectiveMarkers.value,
    ...locationMarkers.value,
  ]);

  return {
    locationMarkers,
    questObjectiveMarkers,
    markers,
  };
}

function isProjectedMarker<T extends ProjectedMarker>(marker: T | null): marker is T {
  return marker !== null;
}

/**
 * Check whether a quest marker can be projected onto a map for the given
 * worldspace. The marker must be non-interior and its worldspace must match
 * the active map's worldspace (or be a sub-world rooted in it).
 */
function isRenderableQuestMarker(marker: MapQuestMarker, mapWorldspace: string): boolean {
  return (
    !marker.isInterior &&
    marker.worldspace === mapWorldspace &&
    (marker.parentWorldspace === null || marker.parentWorldspace === mapWorldspace)
  );
}
