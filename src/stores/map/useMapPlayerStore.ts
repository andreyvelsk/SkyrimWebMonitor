import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { ExteriorPosition, PlayerPosition } from './types';
import { useWebSocketStore } from '@/stores/use-websocket-store/useWebsocketStore';

/**
 * Subscription / query ID used for the on-demand `Player::ExteriorPosition`
 * request. Kept here (and not in pageRegistry) because the query is fired
 * imperatively when the player crosses an interior / sub-world boundary,
 * not on page activation.
 */
export const PLAYER_EXTERIOR_QUERY_ID = 'map.player.exterior';

/**
 * Owns everything related to the player marker on the global map:
 *
 * 1. `position` — high-frequency `Player::Position` feed pushed by the server.
 * 2. `exteriorPosition` — cached `Player::ExteriorPosition`, refreshed
 *    on-demand whenever the live position becomes unrenderable on the
 *    global Tamriel map (player entered an interior or a Tamriel city
 *    sub-world such as `WhiterunWorld`).
 * 3. `displayPosition` — the resolved `(x, y, angle)` to actually plot,
 *    following the recommended client logic from
 *    SkyrimWebSocket / docs/Player.md.
 *
 * The high-frequency setter stays minimal: a single ref write plus a cheap
 * boundary-transition check.
 */
export const useMapPlayerStore = defineStore('mapPlayer', () => {
  /** Latest live `Player::Position` payload, or `null` before the first tick. */
  const position = ref<PlayerPosition | null>(null);

  /**
   * Last known `Player::ExteriorPosition`. Refreshed on-demand the moment
   * the player steps into an interior / sub-world; cleared once the player
   * is back outside in the current map's worldspace and the live feed is
   * renderable again.
   */
  const exteriorPosition = ref<ExteriorPosition | null>(null);

  /**
   * The worldspace of the currently active map (e.g. "Tamriel",
   * "DLC2SolstheimWorld", "fyn"). Set by TheMap.vue whenever the map
   * config changes. Defaults to "Tamriel" for backward compatibility.
   */
  const currentMapWorldspace = ref<string>('Tamriel');

  /** Single in-flight guard so high-frequency ticks don't spam the server. */
  let pendingExteriorQuery = false;

  /**
   * Update the current map's worldspace. Called by TheMap.vue whenever the
   * map config changes (player crosses a worldspace boundary). Controls which
   * worldspace is considered "renderable" for live position and exterior
   * position pinning.
   */
  const setCurrentMapWorldspace = (ws: string): void => {
    currentMapWorldspace.value = ws;
  };

  /**
   * `true` when `Player::Position` itself can be plotted directly on the
   * current map (player is outside, in the map's worldspace proper).
   */
  const isLivePositionRenderable = (p: PlayerPosition): boolean =>
    !p.isInterior
    && p.parentWorldspace === currentMapWorldspace.value;

  /**
   * Fire a one-shot query for `Player::ExteriorPosition`. Safe to call
   * repeatedly — the in-flight guard collapses calls into a single request.
   */
  const requestExteriorPosition = (): void => {
    if (pendingExteriorQuery) return;
    pendingExteriorQuery = true;
    const ws = useWebSocketStore();
    ws.sendQuery(
      PLAYER_EXTERIOR_QUERY_ID,
      { exteriorPosition: 'Player::ExteriorPosition' },
      (fields) => {
        pendingExteriorQuery = false;
        const ext = fields.exteriorPosition as ExteriorPosition | null | undefined;
        exteriorPosition.value = ext ?? null;
      }
    );
  };

  /**
   * High-frequency `Player::Position` setter. Detects boundary transitions
   * to refresh the exterior cache exactly when needed:
   *  - Player just entered an interior / sub-world → fetch ExteriorPosition.
   *  - Player came back out into Tamriel proper → drop the stale cache so
   *    we fall through to live coordinates immediately.
   */
  const setPosition = (data: PlayerPosition | null | undefined): void => {
    const next = data ?? null;
    const prev = position.value;
    position.value = next;
    if (!next) return;

    const liveNext = isLivePositionRenderable(next);
    const livePrev = prev ? isLivePositionRenderable(prev) : true;

    if (!liveNext && (livePrev || !exteriorPosition.value)) {
      // Just stepped into an interior or a Tamriel sub-world (or we never
      // had a cached exterior position to begin with) — refresh the cache.
      requestExteriorPosition();
    } else if (liveNext && exteriorPosition.value) {
      // Back outside in Tamriel — the cache is no longer needed, and
      // dropping it lets `displayPosition` fall straight back to live coords.
      exteriorPosition.value = null;
    }
  };

  /**
   * Resolved player position to render on the current map, following
   * the recommended client logic (see docs/Player.md → "Recommended client
   * logic for a global Tamriel map"):
   *
   *  - Outside in the current map's worldspace → use live `(x, y)`.
   *  - Interior / sub-world with an entrance rooted in the current map's
   *    worldspace → pin to the cached entrance `(x, y)` (`pinned = true`).
   *  - Worldspace that doesn't match the current map → `null` (caller
   *    should hide the marker or switch maps).
   *
   * `angle` always comes from the live feed so the icon's heading stays
   * accurate even while pinned to an entrance.
   */
  const displayPosition = computed<{
    x: number;
    y: number;
    angle: number;
    pinned: boolean;
  } | null>(() => {
    const p = position.value;
    if (!p) return null;
    if (isLivePositionRenderable(p)) {
      return { x: p.x, y: p.y, angle: p.angle, pinned: false };
    }
    const ext = exteriorPosition.value;
    if (ext && ext.parentWorldspace === currentMapWorldspace.value) {
      return { x: ext.x, y: ext.y, angle: p.angle, pinned: true };
    }
    return null;
  });

  return {
    position,
    exteriorPosition,
    displayPosition,
    currentMapWorldspace,
    setPosition,
    setCurrentMapWorldspace,
    requestExteriorPosition,
  };
});

