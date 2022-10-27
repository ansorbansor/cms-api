import minioConfig from 'src/config/minio.config';
import { Provider } from 'src/entities/provider.entity';

export const ProviderResource = (
  provider: Provider,
  userId?: number,
  courseCount?: any,
): any => {
  const countData =
    courseCount && courseCount.find((e) => e.provider_id == provider.id)
      ? courseCount.find((e) => e.provider_id == provider.id)
      : null;
  return {
    id: provider.id,
    name: provider.name,
    fetch_data: provider.fetch_data,
    photo: provider.photo
      ? minioConfig().fullUrl + provider.photoFile.path
      : null,
    last_update: provider.last_update,
    url: provider.url,
    course_count: countData && countData.total ? Number(countData.total) : 0,
  };
};
