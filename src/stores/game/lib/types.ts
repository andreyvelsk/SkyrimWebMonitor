/**
 * Game::Status payload schema.
 * See: https://github.com/andreyvelsk/SkyrimWebSocket/blob/feature/game_status/docs/Game.md
 */
export interface GameStatus {
  paused: boolean;
  loading: boolean;
  inMainMenu: boolean;
  inDialogue: boolean;
  inCombat: boolean;
  dead: boolean;
  controlsEnabled: boolean;
  canAct: boolean;
}

export interface GameStatusData {
  status: GameStatus;
}
