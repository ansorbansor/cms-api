import { Site } from 'src/entities/site.entity';

export const SiteResource = (site: Site): any => {
  return {
    id: site.id,
    name: site.name,
    code: site.code,
  };
};
