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
}

export function useProjectedMapMarkers({
  projectWorldToImage,
  hotspots,
  questMarkers,
  questIconUrl,
}: UseProjectedMapMarkersOptions) {
  const locationMarkers = computed<LocationProjectedMarker[]>(() => {
    return hotspots.value
      .filter((h) => h.isVisible)
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
          isRenderableTamrielQuestMarker(marker) &&
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

function isRenderableTamrielQuestMarker(marker: MapQuestMarker): boolean {
  return (
    !marker.isInterior &&
    marker.worldspace === 'Tamriel' &&
    (marker.parentWorldspace === null || marker.parentWorldspace === 'Tamriel')
  );
}
