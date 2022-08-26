import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'coupon_submissions' })
export class CouponSubmission extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  course_id: number;

  @Column()
  coupon_id: number;

  @Column()
  status: number;

  @Column()
  status_by: number;
}
