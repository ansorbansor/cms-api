/* eslint-disable prettier/prettier */

import minioConfig from "src/config/minio.config";
import { Provider } from "src/entities/provider.entity";

export const ProviderResource = (provider: Provider): any => {
  return {
    id: provider.id,
    name: provider.name,
    fetch_data: provider.fetch_data,
    photo: provider.photo ? minioConfig().fullUrl + provider.photoFile.path : null,
    last_update: provider.last_update,
    url: provider.url,
    course_count: provider.courseCount,
  };
};
