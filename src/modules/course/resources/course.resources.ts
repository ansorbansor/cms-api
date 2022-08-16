import minioConfig from 'src/config/minio.config';
import { Course } from 'src/entities/course.entity';

export const CourseResource = (course: Course): any => {
  return {
    id: course.id,
    name: course.name,
    coach: course.coach,
    duration: course.duration,
    provider: course.provider.name ? course.provider.name : null,
    category: course.courseCategory ? course.courseCategory.name : null,
    topic: course.topic ? course.topic.name : null,
    level: course.courseLevel ? course.courseLevel.name : null,
    language: course.courseLanguage ? course.courseLanguage.name : null,
    date_course: course.date_course,
    rating: course.rating ? course.rating : null,
    description: course.description,
    url: course.url,
    price_name: course.coursePrice ? course.coursePrice.name : null,
    price: course.price,
    freemium_code: course.freemium_code,
    photo: course.photoFile
      ? minioConfig().fullUrl + course.photoFile.path
      : null,
  };
};
