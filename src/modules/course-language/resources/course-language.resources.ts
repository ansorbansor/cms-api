import { CourseLanguage } from 'src/entities/course-language.entity';

export const CourseLanguageResource = (
  language: CourseLanguage,
  userId: number,
  courseCount: any,
): any => {
  const countData =
    courseCount && courseCount.find((e) => e.language_id == language.id)
      ? courseCount.find((e) => e.language_id == language.id)
      : null;

  return {
    id: language.id,
    name: language.name,
    course_count: countData && countData.total ? countData.total : 0,
  };
};
