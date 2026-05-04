import { computed, type Ref } from 'vue';
import type { MapHotspot, MapQuestMarker } from '@/stores/map/types';
import type {
  LocationProjectedMarker,
  ProjectedMarker,
  QuestProjectedMarker,
} from '../types';
import { resolveMarkerIcon } from './useMapMarkerIcons';
import type { AffineMatrix } from './useMapCoordinates';

interface UseProjectedMapMarkersOptions {
  matrix: Ref<AffineMatrix | null>;
  hotspots: Ref<MapHotspot[]>;
  questMarkers: Ref<MapQuestMarker[]>;
  questIconUrl: string;
}

export function useProjectedMapMarkers({
  matrix,
  hotspots,
  questMarkers,
  questIconUrl,
}: UseProjectedMapMarkersOptions) {
  const locationMarkers = computed<LocationProjectedMarker[]>(() => {
    const m = matrix.value;
    if (!m) return [];
    return hotspots.value
      .filter((h) => h.isVisible)
      .map((h) => ({
        key: `location:${h.refId}`,
        kind: 'location',
        refId: h.refId,
        type: h.type,
        label: h.name,
        canFastTravel: h.canFastTravel,
        x: m.a * h.x + m.c * h.y + m.e,
        y: m.b * h.x + m.d * h.y + m.f,
        iconUrl: resolveMarkerIcon(h.type),
      }));
  });

  const questObjectiveMarkers = computed<QuestProjectedMarker[]>(() => {
    const m = matrix.value;
    if (!m) return [];
    return questMarkers.value
      .filter((marker) => Number.isFinite(marker.x) && Number.isFinite(marker.y))
      .map((marker) => ({
        key: `quest:${marker.questFormId}:${marker.objectiveIndex}:${marker.aliasId}:${marker.refId}`,
        kind: 'quest',
        refId: marker.refId,
        type: 'QuestObjective',
        label: marker.objectiveTextResolved || marker.name || marker.questName,
        canFastTravel: false,
        x: m.a * marker.x + m.c * marker.y + m.e,
        y: m.b * marker.x + m.d * marker.y + m.f,
        iconUrl: questIconUrl,
      }));
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
