import minioConfig from 'src/config/minio.config';
import { Banner } from 'src/entities/banner.entity';

export const BannerResource = (banner: Banner): any => {
  return {
    id: banner.id,
    name: banner.name,
    type: banner.type,
    course_id: banner.course_id,
    content: banner.content,
    external_url: banner.external_url,
    photo: banner.photoFile
      ? minioConfig().fullUrl + banner.photoFile.path
      : null,
    position: banner.position,
    status: banner.status,
  };
};
