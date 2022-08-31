import * as moment from 'moment';
export const CouponSubmissionResource = (couponSubmission: any): any => {
  return {
    id: couponSubmission.id,
    created_at: couponSubmission.created_at
      ? moment(couponSubmission.created_at).format('yyyy-MM-D HH:mm:ss')
      : null,
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
    total_submission: Number(couponSubmission.total_submissions),
    total_submission_approved: Number(
      couponSubmission.total_submissions_approved,
    ),
    status: couponSubmission.status,
    reason: couponSubmission.reason ? couponSubmission.reason : null,
  };
};
