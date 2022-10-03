export const FetchUdemyResource = (data: any): any => {
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
    id: data.id,
    title: data.title,
    url: data.url,
    coach: mapCoach,
    image: data.image_480x270,
    headline: data.headline,
    description: data.description,
    rating: data.rating,
    num_reviews: data.num_reviews,
    language: data.locale.title,
    curriculum: data.objectives_summary,
    duration: data.content_info_short,
    level: data.instructional_level_simple,
    price:
      data.price_detail && data.price_detail.amount
        ? data.price_detail.amount
        : 0,
    category: {
      id: data.context_info.category.id,
      name: data.context_info.category.title,
    },
    topic: {
      id:
        data.context_info.label && data.context_info.label.id
          ? data.context_info.label.id
          : null,
      name:
        data.context_info.label && data.context_info.label.title
          ? data.context_info.label.title
          : null,
    },
  };
};
