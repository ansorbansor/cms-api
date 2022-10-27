import { CourseLevel } from 'src/entities/course-level.entity';

export const CourseLevelResource = (
  level: CourseLevel,
  userId?: number,
  courseCount?: any,
): any => {
  const countData =
    courseCount && courseCount.find((e) => e.level_id == level.id)
      ? courseCount && courseCount.find((e) => e.level_id == level.id)
      : null;
  return {
    id: level.id,
    name: level.name,
    course_count: countData && countData.total ? Number(countData.total) : 0,
  };
};
