import { Course } from 'src/entities/course.entity';

export const MasterCourseResource = (course: Course): any => {
  if (course) {
    return {
      id: course.id,
      nama_course: course.name,
      pelatih: course.coach,
      durasi: course.duration,
      penyelenggara:
        course.provider && course.provider.name ? course.provider.name : null,
      kategori:
        course.courseCategory && course.courseCategory.name
          ? course.courseCategory.name
          : null,
      topik: course.topic && course.topic.name ? course.topic.name : null,
      level:
        course.courseLevel && course.courseLevel.name
          ? course.courseLevel.name
          : null,
      tanggal_mulai: course.dateCourseParse ? course.dateCourseParse : null,
      rating: course.rating ? course.rating : null,
      deskripsi: course.description,
      url: course.url,
      nama_harga:
        course.coursePrice && course.coursePrice.name
          ? course.coursePrice.name
          : null,
      harga: course.price,
      kode_freemium: course.freemium_code,
    };
  }

  return null;
};
