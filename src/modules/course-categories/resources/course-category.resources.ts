import minioConfig from 'src/config/minio.config';
import { CourseCategory } from 'src/entities/course-category.entity';

export const CourseCategoryResource = (category: CourseCategory): any => {
  const mapTopic =
    category.topic != null
      ? category.topic.map((topic) => {
          return {
            id: topic.id,
            name: topic.name,
          };
        })
      : [];

  return {
    id: category.id,
    name: category.name,
    photo: category.photoFile
      ? minioConfig().fullUrl + category.photoFile?.path
      : null,
    topic: mapTopic,
  };
};
