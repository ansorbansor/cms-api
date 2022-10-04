import minioConfig from 'src/config/minio.config';
import { Banner } from 'src/entities/banner.entity';
import { CourseResource } from 'src/modules/course/resources/course.resources';

export const BannerResource = (banner: Banner): any => {
  return {
    id: banner.id,
    name: banner.name,
    type: banner.type,
    course: CourseResource(banner.courseData),
    content: banner.content,
    external_url: banner.external_url,
    photo: banner.photoFile
      ? minioConfig().fullUrl + banner.photoFile.path
      : null,
    position: banner.position,
    status: banner.status == 1 ? true : false,
  };
};
