/**
 * Presentation helpers shared by inventory tiles: how a 3D thumbnail should be
 * framed when rendered from the game model.
 */
import type { ThumbnailFraming } from '@/shared/lib/nif';
import type { InventoryItem } from '@/stores/inventory/lib/types';

export function getItemFraming(item: Pick<InventoryItem, 'categoryType'>): ThumbnailFraming {
  return item.categoryType === 'Weapon' || item.categoryType === 'Ammo' ? 'diagonal' : 'upright';
}
