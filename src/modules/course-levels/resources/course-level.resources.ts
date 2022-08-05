import { CourseLevel } from 'src/entities/course-level.entity';

export const CourseLevelResource = (level: CourseLevel): any => {
  return {
    id: level.id,
    name: level.name,
  };
};
