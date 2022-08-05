import { CourseCategory } from 'src/entities/course-category.entity';

export const CourseCategoryResource = (category: CourseCategory): any => {
  return {
    id: category.id,
    name: category.name,
    photo: category.photo,
  };
};
