import { PendingType } from 'src/entities/pending-type.entity';

export const PendingTypeResource = (pendingType: PendingType): any => {
  return {
    id: pendingType.id,
    name: pendingType.name,
  };
};
