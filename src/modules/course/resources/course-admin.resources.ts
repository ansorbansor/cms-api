import minioConfig from 'src/config/minio.config';
import { Course } from 'src/entities/course.entity';

export const CourseAdminResource = (course: Course, userId?: number): any => {
  if (course) {
    const mapLanguage = [];
    course.courseLanguage != null && course.courseLanguage.length > 0
      ? course.courseLanguage.map((language) => {
          if (language.language && language.language.id) {
            mapLanguage.push({
              id: language.language.id ? language.language.id : null,
              name: language.language.name ? language.language.name : null,
            });
          }
        })
      : course.temporaryCourse && course.temporaryCourse.language
      ? mapLanguage.push({
          id: null,
          name: course.temporaryCourse.language,
        })
      : [];

    return {
      id: course.id,
      name: course.name
        ? course.name
        : course.temporaryCourse && course.temporaryCourse.name
        ? course.temporaryCourse.name
        : null,
      coach: course.coach
        ? course.coach
        : course.temporaryCourse && course.temporaryCourse.coach
        ? course.temporaryCourse.coach
        : null,
      duration: course.duration
        ? course.duration
        : course.temporaryCourse && course.temporaryCourse.duration
        ? course.temporaryCourse.duration
        : null,
      provider: course.provider
        ? {
            id: course.provider.id ? course.provider.id : null,
            name: course.provider.name ? course.provider.name : null,
          }
        : null,
      category:
        course.courseCategory || course.temporaryCourse
          ? {
              id:
                course.courseCategory && course.courseCategory.id
                  ? course.courseCategory.id
                  : null,
              name:
                course.courseCategory && course.courseCategory.name
                  ? course.courseCategory.name
                  : course.temporaryCourse.category
                  ? course.temporaryCourse.category
                  : null,
            }
          : null,
      topic:
        course.topic || course.temporaryCourse
          ? {
              id: course.topic && course.topic.id ? course.topic.id : null,
              name:
                course.topic && course.topic.name
                  ? course.topic.name
                  : course.temporaryCourse.topic
                  ? course.temporaryCourse.topic
                  : null,
            }
          : null,
      level:
        course.courseLevel || course.temporaryCourse
          ? {
              id:
                course.courseLevel && course.courseLevel.id
                  ? course.courseLevel.id
                  : null,
              name:
                course.courseLevel && course.courseLevel.name
                  ? course.courseLevel.name
                  : course.temporaryCourse.level
                  ? course.temporaryCourse.level
                  : null,
            }
          : null,
      language: mapLanguage,
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
      status: course.status,
    };
  }

  return null;
};
