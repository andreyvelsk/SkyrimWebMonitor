import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, nextTick, type Ref } from 'vue';
import { useMagicShoutActions } from '@/pages/magic/composables/useMagicShoutActions';
import type { ShoutItem } from '@/stores/magic/lib/types';

vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: () => ({ sendCommand: vi.fn() }),
}));

vi.mock('@/stores/hotkeys/useHotkeysStore', () => ({
  useHotkeysStore: () => ({ getSlotForFormId: () => null }),
}));

function makeShout(name: string, formId: string): ShoutItem {
  return {
    name,
    formId,
    description: '',
    words: [],
    isEquipped: false,
    isFavorite: false,
    hotkeys: [],
  };
}

describe('useMagicShoutActions', () => {
  let list: Ref<ShoutItem[]>;

  beforeEach(() => {
    list = ref<ShoutItem[]>([]);
  });

  function schedule(items: ShoutItem[]) {
    list.value = items;
    return nextTick();
  }

  it('selects the first shout when the list becomes available', async () => {
    const { activeShout } = useMagicShoutActions(() => list.value);
    expect(activeShout.value).toBeNull();

    await schedule([
      makeShout('Fus', 'shout-fus'),
      makeShout('Roh', 'shout-roh'),
    ]);
    expect(activeShout.value).toBe('shout-fus');
  });

  it('re-selects when the active shout disappears from a new list', async () => {
    const { activeShout } = useMagicShoutActions(() => list.value);

    await schedule([
      makeShout('Fus', 'shout-fus'),
      makeShout('Roh', 'shout-roh'),
    ]);
    expect(activeShout.value).toBe('shout-fus');

    await schedule([
      makeShout('Roh', 'shout-roh'),
      makeShout('Dah', 'shout-dah'),
    ]);
    expect(activeShout.value).toBe('shout-roh');
  });

  it('falls back to the previous neighbour, not the new first', async () => {
    const { activeShout } = useMagicShoutActions(() => list.value);

    await schedule([
      makeShout('Aura', 'shout-aura'),
      makeShout('Fus', 'shout-fus'),
      makeShout('Roh', 'shout-roh'),
    ]);
    expect(activeShout.value).toBe('shout-aura');

    await schedule([
      makeShout('Aura', 'shout-aura'),
      makeShout('Roh', 'shout-roh'),
      makeShout('Dah', 'shout-dah'),
    ]);
    expect(activeShout.value).toBe('shout-aura');
  });
});
