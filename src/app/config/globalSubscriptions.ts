/**
 * Global subscriptions registry.
 *
 * Subscriptions listed here are started right after the WebSocket connects
 * (regardless of the active page) and stopped on disconnect. To add a new
 * cross-cutting subscription (e.g. world location, time of day, weather, etc.)
 * simply append a new entry below — `useAppLoader` will pick it up automatically.
 *
 * Each subscription's `subscriptionId` must be routed in
 * `src/stores/adapters/dataRouter.ts` to a corresponding store.
 */
export interface GlobalSubscriptionConfig {
  subscriptionId: string;
  fields: Record<string, string>;
  settings?: {
      /** Push interval in milliseconds. Defaults to the WS client's default when omitted. */
    frequency?: number;
    /** Only push when values change. */
    sendOnChange?: boolean;
  },
}

export const GLOBAL_SUBSCRIPTIONS: Record<string, GlobalSubscriptionConfig> = {
  gameStatus: {
    subscriptionId: 'game.status',
    fields: {
      status: 'Game::Status',
    },
    settings: {
        frequency: 100,
        sendOnChange: true,
    }
  },
};
