import type { SpellItem } from './types';
import type { EquippedHand } from '@/shared/lib/types/common';
import { SPELL_LEVELS } from './types';

export function isMasterLevelSpell(spell: SpellItem): boolean {
  return spell.level >= SPELL_LEVELS.MASTER;
}

export function getEffectiveEquippedHand(spell: SpellItem): EquippedHand {
  if (isMasterLevelSpell(spell) && spell.isEquipped) {
    return 'both';
  }
  return spell.equippedHand;
}
