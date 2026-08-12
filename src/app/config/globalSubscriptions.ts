import type { GlobalSubscriptionConfig } from './types';

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
