import { CourseRating } from 'src/entities/course-rating.entity';

export const CourseRatingResource = (rating: CourseRating): any => {
  return {
    id: rating.id,
    name: rating.name,
  };
};
