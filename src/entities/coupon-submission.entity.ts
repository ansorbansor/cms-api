import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';
import { User } from './user.entity';
import { Coupon } from './coupon.entity';

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

  @Column()
  reason: string;

  @OneToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon?: Coupon;

  total_submissions: number;
}
