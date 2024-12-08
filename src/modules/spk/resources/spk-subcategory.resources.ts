import { SPKSubCategory } from 'src/entities/spk-subcategory.entity';

export const SPKSubCategoryResource = (spkSubCategory: SPKSubCategory): any => {
  return {
    id: spkSubCategory.id,
    name: spkSubCategory.name,
  };
};
