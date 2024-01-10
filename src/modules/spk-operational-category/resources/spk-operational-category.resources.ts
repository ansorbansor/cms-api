import { SPKOperationalCategory } from 'src/entities/spk-operational-category.entity';

export const SPKOperationalCategoryResource = (
  spkOperationalRequestType: SPKOperationalCategory,
): any => {
  if (spkOperationalRequestType) {
    return {
      id: spkOperationalRequestType.id,
      name: spkOperationalRequestType.name,
    };
  }

  return null;
};
