import { Course } from 'src/entities/course.entity';

export const CourseResource = (course: Course): any => {
  return {
    id: course.id,
    name: course.name,
    coach: course.coach,
    duration: course.duration,
    provider: course.provider.name,
    category: course.courseCategory.name,
    topic: course.topic.name,
    level: course.courseLevel.name,
    language: course.courseLanguage.name,
    date_course: course.date_course,
    rating: course.courseRating.name,
    description: course.description,
    url: course.url,
    price_name: course.coursePrice.name,
    price: course.price,
    freemium_code: course.freemium_code,
    photo: course.photoFile.path,
  };
};
