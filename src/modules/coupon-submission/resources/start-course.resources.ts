import { Course } from 'src/entities/course.entity';
import { CourseUserStatus } from 'src/utils/enums';

export const StartCourseResource = (course: Course, type: number): any => {
  return {
    status: type,
    provider_name: course.provider ? course.provider.name : null,
    url:
      course && type == CourseUserStatus.REDIRECT && course.url
        ? course.url
        : null,
  };
};
