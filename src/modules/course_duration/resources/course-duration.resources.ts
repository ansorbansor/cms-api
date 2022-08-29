export const CoursDurationResource = (duration: any): any => {
  return {
    id: duration.id,
    name: duration.name,
    minimum: duration.minimum,
    maximum: duration.maximum,
    course_count: duration.course_count,
  };
};
