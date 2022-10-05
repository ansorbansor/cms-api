import minioConfig from 'src/config/minio.config';
import { EditorChoiceCourse } from 'src/entities/editor-choice-course.entity';

export const EditorChoiceCourseResource = (
  editorChoiceCourse: EditorChoiceCourse,
): any => {
  if (editorChoiceCourse) {
    const mapLanguage =
      editorChoiceCourse.courseData.courseLanguage != null
        ? editorChoiceCourse.courseData.courseLanguage.map((language) => {
            return {
              id: language.language.id ? language.language.id : null,
              name: language.language.name ? language.language.name : null,
            };
          })
        : [];

    return {
      id: editorChoiceCourse.courseData.id,
      name: editorChoiceCourse.courseData.name,
      position: editorChoiceCourse.position,
      coach: editorChoiceCourse.courseData.coach,
      duration: editorChoiceCourse.courseData.duration,
      provider: editorChoiceCourse.courseData.provider
        ? {
            id: editorChoiceCourse.courseData.provider.id
              ? editorChoiceCourse.courseData.provider.id
              : null,
            name: editorChoiceCourse.courseData.provider.name
              ? editorChoiceCourse.courseData.provider.name
              : null,
          }
        : null,
      category: editorChoiceCourse.courseData.courseCategory
        ? {
            id: editorChoiceCourse.courseData.courseCategory.id
              ? editorChoiceCourse.courseData.courseCategory.id
              : null,
            name: editorChoiceCourse.courseData.courseCategory.name
              ? editorChoiceCourse.courseData.courseCategory.name
              : null,
          }
        : null,
      topic: editorChoiceCourse.courseData.topic
        ? {
            id: editorChoiceCourse.courseData.topic.id
              ? editorChoiceCourse.courseData.topic.id
              : null,
            name: editorChoiceCourse.courseData.topic.name
              ? editorChoiceCourse.courseData.topic.name
              : null,
          }
        : null,
      level: editorChoiceCourse.courseData.courseLevel
        ? {
            id: editorChoiceCourse.courseData.courseLevel.id
              ? editorChoiceCourse.courseData.courseLevel.id
              : null,
            name: editorChoiceCourse.courseData.courseLevel.name
              ? editorChoiceCourse.courseData.courseLevel.name
              : null,
          }
        : null,
      language: mapLanguage,
      date_course: {
        name: editorChoiceCourse.courseData.dateCourseParse
          ? 'Terjadwal'
          : 'Mandiri',
        value: editorChoiceCourse.courseData.dateCourseParse,
      },
      rating: editorChoiceCourse.courseData.rating
        ? editorChoiceCourse.courseData.rating
        : null,
      description: editorChoiceCourse.courseData.description,
      url: editorChoiceCourse.courseData.url,
      price_name: editorChoiceCourse.courseData.coursePrice
        ? {
            id: editorChoiceCourse.courseData.coursePrice.id
              ? editorChoiceCourse.courseData.coursePrice.id
              : null,
            name: editorChoiceCourse.courseData.coursePrice.name
              ? editorChoiceCourse.courseData.coursePrice.name
              : null,
          }
        : null,
      price: editorChoiceCourse.courseData.price,
      freemium_code: editorChoiceCourse.courseData.freemium_code,
      photo: editorChoiceCourse.courseData.photoFile
        ? minioConfig().fullUrl + editorChoiceCourse.courseData.photoFile.path
        : null,
    };
  }

  return null;
};
