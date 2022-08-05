import { Category } from 'src/entities/category.entity';

export const CategoryResource = (category: Category): any => {
  return {
    id: category.id,
    name: category.name,
    photo: category.photo,
  };
};
