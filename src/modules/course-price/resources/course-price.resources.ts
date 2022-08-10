import { CoursePrice } from 'src/entities/course-price.entity';

export const CoursePriceResource = (price: CoursePrice): any => {
  return {
    id: price.id,
    name: price.name,
  };
};
