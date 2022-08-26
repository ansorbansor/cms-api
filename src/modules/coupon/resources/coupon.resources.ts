import { Coupon } from 'src/entities/coupon.entity';
import { CourseResource } from 'src/modules/course/resources/course.resources';
import { ProviderResource } from 'src/modules/providers/resources/provider.resources';

export const CouponResource = (coupon: Coupon): any => {
  return {
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    provider: coupon.provider ? ProviderResource(coupon.provider) : null,
    course: coupon.course ? CourseResource(coupon.course) : null,
    amount: coupon.amount,
    type: coupon.type,
    status: coupon.status,
    start_date: coupon.startDateParseDate,
    end_date: coupon.endDateParseDate,
  };
};
