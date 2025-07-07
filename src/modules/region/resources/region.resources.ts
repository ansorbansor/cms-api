import { Region } from 'src/entities/region.entity';

export const RegionResource = (region: Region): any => {
  return {
    id: region.id,
    name: region.name,
  };
};
