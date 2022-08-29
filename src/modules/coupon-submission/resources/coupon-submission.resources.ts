export const CouponSubmissionResource = (couponSubmission: any): any => {
  return {
    created_at: couponSubmission.createdAtParseDate,
    user: {
      nip: couponSubmission.user_nip ? couponSubmission.user_nip : null,
      name: couponSubmission.user_name ? couponSubmission.user_name : null,
      position: couponSubmission.user_position
        ? couponSubmission.user_position
        : null,
      level: couponSubmission.user_level ? couponSubmission.user_level : null,
      blacklist: couponSubmission.user_blacklist,
    },
    price: couponSubmission.course_price,
    total_submission: couponSubmission.total_submissions,
  };
};
