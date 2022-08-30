export const CouponSubmissionDetailResource = (
  couponSubmission: any,
  totalSubmission: number,
  totalSubmissionApproved: number,
): any => {
  const mapCat = [];
  couponSubmission.user.userTopic.map((category) => {
    if (!mapCat.some((e) => e.category_id == category.category_id)) {
      const mapTopic = couponSubmission.user.userTopic.filter(
        (topic) => topic.category_id == category.category_id,
      );
      mapCat.push({
        category_id: category.category.id,
        category_name: category.category.name,
        topics: mapTopic.map((topic) => {
          return {
            topic_id: topic.topic.id,
            topic_name: topic.topic.name,
          };
        }),
      });
    }
  });

  return {
    id: couponSubmission.id,
    created_at: couponSubmission.createdAtParseDate
      ? couponSubmission.createdAtParseDate
      : null,
    total_submission: Number(totalSubmission),
    total_submission_approved: Number(totalSubmissionApproved),
    user: {
      nip: couponSubmission.user.nip ? couponSubmission.user.nip : null,
      name: couponSubmission.user.name ? couponSubmission.user.name : null,
      position: couponSubmission.user.employeePosition.name
        ? couponSubmission.user.employeePosition.name
        : null,
      level: couponSubmission.user.employeeLevel.name
        ? couponSubmission.user.employeeLevel.name
        : null,
      blacklist: couponSubmission.user.blacklist,
      photo: couponSubmission.user.photoFile
        ? couponSubmission.user.photoFile.path
        : null,
      unit: couponSubmission.user.employeeUnit
        ? couponSubmission.user.employeeUnit.name
        : null,
      role: couponSubmission.user.userRole
        ? couponSubmission.user.userRole[0].role.name
        : null,
      email: couponSubmission.user.email ? couponSubmission.user.email : null,
      categories: mapCat ? mapCat : [],
    },
    coupon: {
      name: couponSubmission.coupon.name ? couponSubmission.coupon.name : null,
      code: couponSubmission.coupon.code ? couponSubmission.coupon.code : null,
      amount: couponSubmission.coupon.amount
        ? couponSubmission.coupon.amount
        : null,
      start_date: couponSubmission.coupon.startDateParseDate
        ? couponSubmission.coupon.startDateParseDate
        : null,
      end_date: couponSubmission.coupon.endDateParseDate
        ? couponSubmission.coupon.endDateParseDate
        : null,
      provider: couponSubmission.coupon.provider
        ? couponSubmission.coupon.provider.name
        : null,
      type: couponSubmission.coupon.type,
      course: couponSubmission.coupon.course
        ? couponSubmission.coupon.course.name
        : null,
    },
    price: couponSubmission.course_price,
    status: couponSubmission.status,
  };
};
