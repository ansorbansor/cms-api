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
      unit: {
        id: couponSubmission.user_unit_id
          ? couponSubmission.user_unit_id
          : null,
        name: couponSubmission.user_unit_name
          ? couponSubmission.user_unit_name
          : null,
      },
      level: {
        id: couponSubmission.user_level_id
          ? couponSubmission.user_level_id
          : null,
        name: couponSubmission.user_level_name
          ? couponSubmission.user_level_name
          : null,
      },
      position: {
        id: couponSubmission.user_position_id
          ? couponSubmission.user_position_id
          : null,
        name: couponSubmission.user_position_name
          ? couponSubmission.user_position_name
          : null,
      },
      role: {
        id: couponSubmission.role_id,
        name: couponSubmission.role_name,
      },
      blacklist: couponSubmission.user_blacklist,
    },
    price: couponSubmission.course_price,
    total_submission: Number(couponSubmission.total_submissions),
    total_submission_approved: Number(
      couponSubmission.total_submissions_approved,
    ),
    status: couponSubmission.status,
    reason: couponSubmission.reason ? couponSubmission.reason : null,
    provider: {
      id: couponSubmission.provider_id,
      name: couponSubmission.provider_name,
    },
  };
};
