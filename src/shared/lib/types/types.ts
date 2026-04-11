export interface CategoryItem {
  categoryId: string;
  count: number;
  name: string;
}

export interface CategoriesData {
  categories: CategoryItem[];
}