import { atom } from 'recoil';
import { Category } from '@prisma/client';

export interface CategoryWithLabel extends Category {
  label: string;
}

export const categoryState = atom<CategoryWithLabel[]>({
  key: 'categoryState',
  default: []
});

export const selectedCategoryState = atom<CategoryWithLabel | null>({
  key: 'selectedCategoryState',
  default: null
}); 