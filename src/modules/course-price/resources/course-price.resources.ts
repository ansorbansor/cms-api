import { CoursePrice } from 'src/entities/course-price.entity';

export const CoursePriceResource = (
  price: CoursePrice,
  userId: number,
  courseCount: any,
): any => {
  const countData =
    courseCount && courseCount.find((e) => e.price_id == price.id)
      ? courseCount && courseCount.find((e) => e.price_id == price.id)
      : null;

  return {
    id: price.id,
    name: price.name,
    course_count: countData && countData.total ? countData.total : 0,
  };
};
