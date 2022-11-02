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
      url: data.url ? `${coursePageUrl}${data.url}` : null,
      coach: mapCoach,
      image: data.image_480x270 ? data.image_480x270 : null,
      headline: data.headline ? data.headline : null,
      description: data.description ? data.description : '-',
      rating: data.rating ? data.rating : null,
      rating_count: data.num_reviews ? data.num_reviews : 0,
      num_reviews: data.num_reviews ? data.num_reviews : 0,
      language: data.locale && data.locale.title ? data.locale.title : null,
      curriculum: data.objectives_summary ? data.objectives_summary : null,
      duration:
        typeof data.content_info_short === 'string' ||
        data.content_info_short instanceof String
          ? data.content_info_short.replace(',', '.').replace(/[^0-9.]/g, '') *
            60
          : data.content_info_short * 60,
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
      image: data.imageURL ? data.imageURL : null,
      headline: null,
      description: data.description ? data.description : '-',
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
          ? Math.round(dataDetail.data.courseTopic.totalDuration / 60)
          : 0,
      level: 'Pemula',
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
  } else if (provider.toLocaleLowerCase().includes('terampil')) {
    return {
      id: data.id ? data.id : null,
      title: data.title ? data.title : null,
      url: data.slug ? `${coursePageUrl}${data.slug}` : null,
      coach: data.trainer && data.trainer.fullname ? data.trainer.fullname : '',
      image: data.thumbnail ? data.thumbnail : null,
      headline: null,
      description: data.description ? data.description : '-',
      rating: data.rating ? data.rating : 0,
      rating_count: data.rating.total_rating ? data.rating.total_rating : 0,
      num_reviews: data.rating.total_rating ? data.rating.total_rating : 0,
      language: 'Indonesia',
      curriculum: data.benefits ? data.benefits : null,
      duration: data.durations ? Math.round(data.durations / 60) : 0,
      level: 'Pemula',
      price: data.training_price ? data.training_price : 0,
      category: {
        id: data.category && data.category.id ? data.category.id : null,
        name: data.category && data.category.name ? data.category.name : null,
      },
      topic: {
        id:
          data.tag && data.tag.length > 0 && data.tag[0].serial
            ? data.tag[0].serial
            : null,
        name:
          data.tag && data.tag.length > 0 && data.tag[0].name
            ? data.tag[0].name
            : null,
      },
    };
  }
};
