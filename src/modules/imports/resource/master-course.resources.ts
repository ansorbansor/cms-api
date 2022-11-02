export const MasterCourseResource = (course: any): any => {
  if (course) {
    return {
      id: course.id,
      nama_course: course.course_name,
      penyelenggara:
        course && course.provider_name ? course.provider_name : null,
      harga: course.price,
    };
  }

  return null;
};
