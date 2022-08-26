import { Course } from 'src/entities/course.entity';

export const StartCourseResource = (course: Course): any => {
  if (course) {
    return {
      url: course.url ? course.url : null,
    };
  }

  return null;
};
