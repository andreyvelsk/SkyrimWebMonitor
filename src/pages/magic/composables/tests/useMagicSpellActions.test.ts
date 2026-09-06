import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, nextTick, type Ref } from 'vue';
import { useMagicSpellActions } from '@/pages/magic/composables/useMagicSpellActions';
import type { SpellItem } from '@/stores/magic/lib/types';

vi.mock('@/stores/use-websocket-store/useWebsocketStore', () => ({
  useWebSocketStore: () => ({ sendCommand: vi.fn() }),
}));

vi.mock('@/stores/hotkeys/useHotkeysStore', () => ({
  useHotkeysStore: () => ({ getSlotForFormId: () => null }),
}));

function makeSpell(name: string, formId: string): SpellItem {
  return {
    name,
    formId,
    categoryType: 'Destruction',
    cost: 10,
    costValue: 10,
    level: 1,
    castingType: 'FireAndForget',
    delivery: 'Aimed',
    range: 100,
    chargeTime: 0.5,
    effects: [],
    isFavorite: false,
    isEquipped: false,
    equippedHand: null,
    isActive: false,
    hotkeys: [],
  };
}

describe('useMagicSpellActions', () => {
  let list: Ref<SpellItem[]>;

  beforeEach(() => {
    list = ref<SpellItem[]>([]);
  });

  function schedule(items: SpellItem[]) {
    list.value = items;
    return nextTick();
  }

  it('selects the first spell when the list becomes available', async () => {
    const { activeSpell } = useMagicSpellActions(() => list.value);
    expect(activeSpell.value).toBeNull();

    await schedule([
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Ice Spike', 'spell-ice'),
    ]);
    expect(activeSpell.value).toBe('spell-fire');
  });

  it('re-selects the first spell when the active spell disappears from a new list', async () => {
    const { activeSpell } = useMagicSpellActions(() => list.value);

    await schedule([
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Ice Spike', 'spell-ice'),
    ]);
    expect(activeSpell.value).toBe('spell-fire');

    // The previously active spell is gone in the refreshed list.
    await schedule([
      makeSpell('Ice Spike', 'spell-ice'),
      makeSpell('Lightning Bolt', 'spell-lightning'),
    ]);
    expect(activeSpell.value).toBe('spell-ice');
  });

  it('falls back to the previous neighbour, not the new first', async () => {
    const { activeSpell } = useMagicSpellActions(() => list.value);

    await schedule([
      makeSpell('Candlelight', 'spell-candle'),
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Ice Spike', 'spell-ice'),
    ]);
    expect(activeSpell.value).toBe('spell-candle');

    // Fireball disappears; the neighbour behind it (Candlelight) still exists.
    await schedule([
      makeSpell('Candlelight', 'spell-candle'),
      makeSpell('Ice Spike', 'spell-ice'),
      makeSpell('Lightning Bolt', 'spell-lightning'),
    ]);
    expect(activeSpell.value).toBe('spell-candle');
  });

  it('falls back to the first spell when the neighbour is also gone', async () => {
    const { activeSpell } = useMagicSpellActions(() => list.value);

    await schedule([
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Ice Spike', 'spell-ice'),
    ]);
    expect(activeSpell.value).toBe('spell-fire');

    // Neither the active spell nor anything behind it survives.
    await schedule([makeSpell('Lightning Bolt', 'spell-lightning')]);
    expect(activeSpell.value).toBe('spell-lightning');
  });

  it('keeps an existing active spell when the list re-sorts', async () => {
    const { activeSpell } = useMagicSpellActions(() => list.value);

    await schedule([
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Ice Spike', 'spell-ice'),
    ]);
    expect(activeSpell.value).toBe('spell-fire');

    await schedule([
      makeSpell('Ice Spike', 'spell-ice'),
      makeSpell('Fireball', 'spell-fire'),
      makeSpell('Lightning Bolt', 'spell-lightning'),
    ]);
    expect(activeSpell.value).toBe('spell-fire');
  });
});
