export const FinishCourseResource = (data: any): any => {
  return {
    course_id: data.course_id,
    nip: data.nip,
    certificate_number: data.certificate_number,
    certificate_date: data.certificate_date,
    certificate_image: data.certificate_image,
  };
};
