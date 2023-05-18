import { SPKCategory } from 'src/entities/spk-category.entity';

export const SPKCategoryResource = (spkCategory: SPKCategory): any => {
  return {
    id: spkCategory.id,
    name: spkCategory.name,
  };
};
