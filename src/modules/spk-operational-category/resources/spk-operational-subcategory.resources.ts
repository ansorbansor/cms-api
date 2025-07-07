import { SPKOperationalSubCategory } from 'src/entities/spk-operational-subcategory.entity';

export const SPKOperationalSubCategoryResource = (
  spkOperationalRequestType: SPKOperationalSubCategory,
): any => {
  if (spkOperationalRequestType) {
    return {
      id: spkOperationalRequestType.id,
      name: spkOperationalRequestType.name,
    };
  }

  return null;
};
