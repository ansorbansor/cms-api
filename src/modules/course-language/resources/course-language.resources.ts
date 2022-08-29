import { CourseLanguage } from 'src/entities/course-language.entity';

export const CourseLanguageResource = (language: CourseLanguage): any => {
  return {
    id: language.id,
    name: language.name,
    course_count: language.course_count,
  };
};
