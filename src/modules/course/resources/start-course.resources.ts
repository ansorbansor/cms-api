import { Course } from 'src/entities/course.entity';

export const StartCourseResource = (course: Course, type: number): any => {
  return {
    status: type,
    url: course && course.url ? course.url : null,
  };
};
