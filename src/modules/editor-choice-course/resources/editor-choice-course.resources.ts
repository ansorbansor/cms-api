import minioConfig from 'src/config/minio.config';
import { EditorChoiceCourse } from 'src/entities/editor-choice-course.entity';

export const EditorChoiceCourseResource = (
  editorChoiceCourse: EditorChoiceCourse,
): any => {
  if (editorChoiceCourse) {
    const mapLanguage =
      editorChoiceCourse.course.courseLanguage != null
        ? editorChoiceCourse.course.courseLanguage.map((language) => {
            return {
              id: language.language.id ? language.language.id : null,
              name: language.language.name ? language.language.name : null,
            };
          })
        : [];

    return {
      id: editorChoiceCourse.course.id,
      name: editorChoiceCourse.course.name,
      position: editorChoiceCourse.position,
      coach: editorChoiceCourse.course.coach,
      duration: editorChoiceCourse.course.duration,
      provider: editorChoiceCourse.course.provider
        ? {
            id: editorChoiceCourse.course.provider.id
              ? editorChoiceCourse.course.provider.id
              : null,
            name: editorChoiceCourse.course.provider.name
              ? editorChoiceCourse.course.provider.name
              : null,
          }
        : null,
      category: editorChoiceCourse.course.courseCategory
        ? {
            id: editorChoiceCourse.course.courseCategory.id
              ? editorChoiceCourse.course.courseCategory.id
              : null,
            name: editorChoiceCourse.course.courseCategory.name
              ? editorChoiceCourse.course.courseCategory.name
              : null,
          }
        : null,
      topic: editorChoiceCourse.course.topic
        ? {
            id: editorChoiceCourse.course.topic.id
              ? editorChoiceCourse.course.topic.id
              : null,
            name: editorChoiceCourse.course.topic.name
              ? editorChoiceCourse.course.topic.name
              : null,
          }
        : null,
      level: editorChoiceCourse.course.courseLevel
        ? {
            id: editorChoiceCourse.course.courseLevel.id
              ? editorChoiceCourse.course.courseLevel.id
              : null,
            name: editorChoiceCourse.course.courseLevel.name
              ? editorChoiceCourse.course.courseLevel.name
              : null,
          }
        : null,
      language: mapLanguage,
      date_course: {
        name: editorChoiceCourse.course.dateCourseParse
          ? 'Terjadwal'
          : 'Mandiri',
        value: editorChoiceCourse.course.dateCourseParse,
      },
      rating: editorChoiceCourse.course.rating
        ? editorChoiceCourse.course.rating
        : null,
      description: editorChoiceCourse.course.description,
      url: editorChoiceCourse.course.url,
      price_name: editorChoiceCourse.course.coursePrice
        ? {
            id: editorChoiceCourse.course.coursePrice.id
              ? editorChoiceCourse.course.coursePrice.id
              : null,
            name: editorChoiceCourse.course.coursePrice.name
              ? editorChoiceCourse.course.coursePrice.name
              : null,
          }
        : null,
      price: editorChoiceCourse.course.price,
      freemium_code: editorChoiceCourse.course.freemium_code,
      photo: editorChoiceCourse.course.photoFile
        ? minioConfig().fullUrl + editorChoiceCourse.course.photoFile.path
        : null,
    };
  }

  return null;
};
