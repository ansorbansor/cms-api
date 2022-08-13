import { CourseCategory } from 'src/entities/course-category.entity';

export const CourseCategoryResource = (category: CourseCategory): any => {
  const mapTopic =
    category.topic != null
      ? category.topic.map((topic) => {
          return {
            id: topic.id,
            name: topic.name,
          };
        })
      : [];

  return {
    id: category.id,
    name: category.name,
    photo: category.photo,
    topic: mapTopic,
  };
};
