import minioConfig from 'src/config/minio.config';
import { Course } from 'src/entities/course.entity';

export const CourseAdminResource = (course: Course, userId?: number): any => {
  if (course) {
    return {
      id: course.id,
      name: course.name,
      coach: course.coach,
      duration: course.duration,
      provider: course.provider
        ? {
            id: course.provider.id ? course.provider.id : null,
            name: course.provider.name ? course.provider.name : null,
          }
        : null,
      category: course.courseCategory
        ? {
            id: course.courseCategory.id ? course.courseCategory.id : null,
            name: course.courseCategory.name
              ? course.courseCategory.name
              : null,
          }
        : null,
      topic: course.topic
        ? {
            id: course.topic.id ? course.topic.id : null,
            name: course.topic.name ? course.topic.name : null,
          }
        : null,
      level: course.courseLevel
        ? {
            id: course.courseLevel.id ? course.courseLevel.id : null,
            name: course.courseLevel.name ? course.courseLevel.name : null,
          }
        : null,
      language: course.courseLanguage
        ? {
            id: course.courseLanguage.id ? course.courseLanguage.id : null,
            name: course.courseLanguage.name
              ? course.courseLanguage.name
              : null,
          }
        : null,
      date_course: {
        name: course.dateCourseParse ? 'Terjadwal' : 'Mandiri',
        value: course.dateCourseParse,
      },
      rating: course.rating ? course.rating : null,
      description: course.description,
      url: course.url,
      price_name: course.coursePrice
        ? {
            id: course.coursePrice.id ? course.coursePrice.id : null,
            name: course.coursePrice.name ? course.coursePrice.name : null,
          }
        : null,
      price: course.price,
      freemium_code: course.freemium_code,
      photo: course.photoFile
        ? minioConfig().fullUrl + course.photoFile.path
        : null,
      liked: userId
        ? course.userLike
          ? course.userLike.some((e) => e.user_id == userId)
          : false
        : false,
      progress: userId
        ? course.userCourse
          ? course.userCourse.some((e) =>
              e.user_id == userId ? e.progress : 0,
            )
          : 0
        : 0,
    };
  }

  return null;
};
