import { Transportation } from 'src/entities/transportation.entity';

export const TransportationResource = (transportation: Transportation): any => {
  return {
    id: transportation.id,
    name: transportation.name,
  };
};
