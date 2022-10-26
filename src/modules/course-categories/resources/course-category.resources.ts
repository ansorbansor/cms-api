import minioConfig from 'src/config/minio.config';
import { CourseCategory } from 'src/entities/course-category.entity';

export const CourseCategoryResource = (
  category: CourseCategory,
  userId?: number,
  courseCount?: any,
): any => {
  const mapTopic =
    category.topic != null
      ? category.topic.map((topic) => {
          const topicCount =
            courseCount && courseCount.topicCourseCount
              ? courseCount.topicCourseCount.find((e) => e.topic_id == topic.id)
              : null;
          return {
            id: topic.id,
            name: topic.name,
            course_count: topicCount && topicCount.total ? topicCount.total : 0,
          };
        })
      : [];

  const categoryCourseCount =
    courseCount && courseCount.categoryCourseCount
      ? courseCount.categoryCourseCount.find(
          (e) => e.category_id == category.id,
        )
      : null;

  return {
    id: category.id,
    name: category.name,
    pkasn_program: category.pkasn_program,
    photo: category.photoFile
      ? minioConfig().fullUrl + category.photoFile?.path
      : null,
    topic: mapTopic,
    topic_count: category.topic_count,
    course_count:
      courseCount && categoryCourseCount ? categoryCourseCount.total : 0,
  };
};
