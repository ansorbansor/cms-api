export const FetchCourseResource = (
  data: any,
  provider: string,
  coursePageUrl: string,
  dataDetail: any,
): any => {
  if (provider.toLocaleLowerCase().includes('udemy')) {
    let mapCoach = '';
    data.visible_instructors != null
      ? data.visible_instructors.map((coach, i) => {
          mapCoach += coach.name;
          if (i != data.visible_instructors.length - 1) {
            mapCoach += ', ';
          }
        })
      : [];

    return {
      id: data.id ? data.id : null,
      title: data.title ? data.title : null,
      url: data.url ? `${coursePageUrl}/${data.url}` : null,
      coach: mapCoach,
      image: data.image_480x270 ? data.image_480x270 : null,
      headline: data.headline ? data.headline : null,
      description: data.description ? data.description : null,
      rating: data.rating ? data.rating : null,
      rating_count: data.num_reviews ? data.num_reviews : 0,
      num_reviews: data.num_reviews ? data.num_reviews : 0,
      language: data.locale && data.locale.title ? data.locale.title : null,
      curriculum: data.objectives_summary ? data.objectives_summary : null,
      duration: data.content_info_short ? data.content_info_short : 0,
      level: data.instructional_level_simple
        ? data.instructional_level_simple
        : null,
      price:
        data.price_detail && data.price_detail.amount
          ? data.price_detail.amount
          : 0,
      category: {
        id:
          data.context_info &&
          data.context_info.category &&
          data.context_info.category.id
            ? data.context_info.category.id
            : null,
        name:
          data.context_info &&
          data.context_info.category &&
          data.context_info.category.title
            ? data.context_info.category.title
            : null,
      },
      topic: {
        id:
          data.context_info &&
          data.context_info.label &&
          data.context_info.label.id
            ? data.context_info.label.id
            : null,
        name:
          data.context_info &&
          data.context_info.label &&
          data.context_info.label.title
            ? data.context_info.label.title
            : null,
      },
    };
  } else if (provider.toLocaleLowerCase().includes('skill academy')) {
    return {
      id: data.serial ? data.serial : null,
      title: data.name ? data.name : null,
      url: data.slug ? `${coursePageUrl}${data.slug}` : null,
      coach:
        data.instructor && data.instructor.name ? data.instructor.name : '',
      image: data.imageUrl ? data.imageURL : null,
      headline: null,
      description: data.description ? data.description : null,
      rating: data.rating && data.rating.average ? data.rating.average : 0,
      rating_count: data.rating && data.rating.total ? data.rating.total : 0,
      num_reviews: data.rating && data.rating.total ? data.rating.total : 0,
      language: 'Indonesia',
      curriculum: null,
      duration:
        dataDetail &&
        dataDetail.data &&
        dataDetail.data.courseTopic &&
        dataDetail.data.courseTopic.totalDuration
          ? dataDetail.data.courseTopic.totalDuration
          : 0,
      level: null,
      price: data.price && data.price.price ? data.price.price : 0,
      category: {
        id: data.category && data.category.serial ? data.category.serial : null,
        name: data.category && data.category.name ? data.category.name : null,
      },
      topic: {
        id:
          data.topics && data.topics.length > 0 && data.topics[0].serial
            ? data.topics[0].serial
            : null,
        name:
          data.topics && data.topics.length > 0 && data.topics[0].name
            ? data.topics[0].name
            : null,
      },
    };
  }
};
