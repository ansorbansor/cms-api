import { Category } from 'src/entities/category.entity';

export const CourseCategoryResource = (category: Category): any => {
  return {
    id: category.id,
    name: category.name,
    photo: category.photo,
  };
};
