import { Coupon } from 'src/entities/coupon.entity';
import { CourseResource } from 'src/modules/course/resources/course.resources';
import { ProviderResource } from 'src/modules/providers/resources/provider.resources';
import * as moment from 'moment';

export const CouponResource = (coupon: Coupon): any => {
  return {
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    provider: coupon.provider ? ProviderResource(coupon.provider) : null,
    course: coupon.course ? CourseResource(coupon.course) : null,
    amount: coupon.amount,
    type: coupon.type,
    status:
      coupon.status == 1 &&
      moment().toDate() >=
        moment(coupon.startDateParseDate, 'yyyy-MM-D HH:mm:ss').toDate() &&
      moment().toDate() <=
        moment(coupon.endDateParseDate, 'yyyy-MM-D HH:mm:ss').toDate()
        ? 1
        : 0,
    start_date: coupon.startDateParseDate,
    end_date: coupon.endDateParseDate,
  };
};
