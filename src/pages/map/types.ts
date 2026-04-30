import type { MapHotspotType } from '@/stores/map/types';

export interface BaseProjectedMarker {
  key: string;
  refId: string;
  label: string;
  canFastTravel: boolean;
  x: number;
  y: number;
  iconUrl: string;
}

export interface LocationProjectedMarker extends BaseProjectedMarker {
  kind: 'location';
  type: MapHotspotType;
}

export interface QuestProjectedMarker extends BaseProjectedMarker {
  kind: 'quest';
  type: 'QuestObjective';
}

export interface PlayerOverlayPosition {
  x: number;
  y: number;
  angleDeg: number;
}

export type ProjectedMarker = LocationProjectedMarker | QuestProjectedMarker;

export function isLocationMarker(marker: ProjectedMarker): marker is LocationProjectedMarker {
  return marker.kind === 'location';
}

export function isQuestMarker(marker: ProjectedMarker): marker is QuestProjectedMarker {
  return marker.kind === 'quest';
}
