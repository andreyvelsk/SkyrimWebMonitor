import { InventoryItem } from "@/stores/inventory/types";
import { SpellItem } from "@/stores/magic/types";

export interface CategoryItem {
  categoryId: string;
  count: number;
  name: string;
}

export interface CategoriesData {
  categories: CategoryItem[];
}

export type ListItem = InventoryItem | SpellItem;