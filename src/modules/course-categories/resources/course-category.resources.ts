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
              ? courseCount.topicCourseCount.find(
                  (e) => e.topic_id == topic.id && e.category_id == category.id,
                )
              : null;
          return {
            id: topic.id,
            name: topic.name,
            course_count:
              topicCount && topicCount.total ? Number(topicCount.total) : 0,
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
    pkasn_program: category.pkasnProgram
      ? {
          id: category.pkasnProgram.id ? category.pkasnProgram.id : null,
          name: category.pkasnProgram.name ? category.pkasnProgram.name : null,
        }
      : null,
    photo: category.photoFile
      ? minioConfig().fullUrl + category.photoFile?.path
      : null,
    topic: mapTopic,
    topic_count: category.topic_count,
    course_count:
      courseCount && categoryCourseCount
        ? Number(categoryCourseCount.total)
        : 0,
  };
};
