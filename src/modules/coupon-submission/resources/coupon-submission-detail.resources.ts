import minioConfig from 'src/config/minio.config';

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
        category_id: category.category_id,
        category_name: category.category_name,
        topics: mapTopic.map((topic) => {
          return {
            topic_id: topic.topic_id,
            topic_name: topic.topic_name,
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
    total_submission: totalSubmission ? Number(totalSubmission) : 0,
    total_submission_approved: totalSubmissionApproved
      ? Number(totalSubmissionApproved)
      : 0,
    reason: couponSubmission.reason ? couponSubmission.reason : null,
    user: {
      nip:
        couponSubmission.user && couponSubmission.user.nip
          ? couponSubmission.user.nip
          : null,
      name:
        couponSubmission.user && couponSubmission.user.name
          ? couponSubmission.user.name
          : null,
      position: {
        id:
          couponSubmission.user &&
          couponSubmission.user.employeePosition &&
          couponSubmission.user.employeePosition.id
            ? couponSubmission.user.employeePosition.id
            : null,
        name:
          couponSubmission.user &&
          couponSubmission.user.employeePosition &&
          couponSubmission.user.employeePosition.name
            ? couponSubmission.user.employeePosition.name
            : null,
      },
      level: {
        id:
          couponSubmission.user &&
          couponSubmission.user.employeeLevel &&
          couponSubmission.user.employeeLevel.id
            ? couponSubmission.user.employeeLevel.id
            : null,
        name:
          couponSubmission.user &&
          couponSubmission.user.employeeLevel &&
          couponSubmission.user.employeeLevel.name
            ? couponSubmission.user.employeeLevel.name
            : null,
      },
      blacklist: couponSubmission.user
        ? couponSubmission.user.blacklist
        : false,
      photo:
        couponSubmission.user &&
        couponSubmission.user.photoFile &&
        couponSubmission.user.photoFile
          ? minioConfig().fullUrl + couponSubmission.user.photoFile.path
          : null,
      unit: {
        id:
          couponSubmission.user &&
          couponSubmission.user.employeeUnit &&
          couponSubmission.user.employeeUnit.id
            ? couponSubmission.user.employeeUnit.id
            : null,
        name:
          couponSubmission.user &&
          couponSubmission.user.employeeUnit &&
          couponSubmission.user.employeeUnit.name
            ? couponSubmission.user.employeeUnit.name
            : null,
      },
      role: {
        id:
          couponSubmission.user &&
          couponSubmission.user.userRoles &&
          couponSubmission.user.userRoles.length > 0 &&
          couponSubmission.user.userRoles[0].roleData
            ? couponSubmission.user.userRoles[0].roleData.id
            : null,
        name:
          couponSubmission.user &&
          couponSubmission.user.userRoles &&
          couponSubmission.user.userRoles.length > 0 &&
          couponSubmission.user.userRoles[0].roleData
            ? couponSubmission.user.userRoles[0].roleData.name
            : null,
      },
      email:
        couponSubmission.user && couponSubmission.user.email
          ? couponSubmission.user.email
          : null,
      categories: mapCat ? mapCat : [],
    },
    coupon: {
      name:
        couponSubmission.coupon && couponSubmission.coupon.name
          ? couponSubmission.coupon.name
          : null,
      code:
        couponSubmission.coupon && couponSubmission.coupon.code
          ? couponSubmission.coupon.code
          : null,
      amount:
        couponSubmission.coupon && couponSubmission.coupon.amount
          ? couponSubmission.coupon.amount
          : null,
      start_date:
        couponSubmission.coupon && couponSubmission.coupon.startDateParseDate
          ? couponSubmission.coupon.startDateParseDate
          : null,
      end_date:
        couponSubmission.coupon && couponSubmission.coupon.endDateParseDate
          ? couponSubmission.coupon.endDateParseDate
          : null,
      provider:
        couponSubmission.coupon && couponSubmission.coupon.couponProvider
          ? couponSubmission.coupon.couponProvider.name
          : null,
      type: couponSubmission.coupon && couponSubmission.coupon.type,
      course:
        couponSubmission.coupon && couponSubmission.coupon.course
          ? couponSubmission.coupon.course.name
          : null,
    },
    price: couponSubmission.course.price,
    status: couponSubmission.status,
    provider: {
      id:
        couponSubmission &&
        couponSubmission.course &&
        couponSubmission.course.provider &&
        couponSubmission.course.provider.id
          ? couponSubmission.course.provider.id
          : null,
      name:
        couponSubmission &&
        couponSubmission.course &&
        couponSubmission.course.provider &&
        couponSubmission.course.provider.name
          ? couponSubmission.course.provider.name
          : null,
    },
  };
};
