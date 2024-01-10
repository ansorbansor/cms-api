import { SPKOperationalRequestType } from 'src/entities/spk-operational-request-type.entity';

export const SPKOperationalRequestTypeResource = (
  spkOperationalRequestType: SPKOperationalRequestType,
): any => {
  if (spkOperationalRequestType) {
    return {
      id: spkOperationalRequestType.id,
      name: spkOperationalRequestType.name,
    };
  }

  return null;
};
