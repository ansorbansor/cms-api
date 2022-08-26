import { AfterLoad, Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';
import { Provider } from './provider.entity';
import * as moment from 'moment';

@Entity({ name: 'coupons' })
export class Coupon extends EntityHelper {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column()
  provider_id: number;

  @Column()
  amount: number;

  @Column()
  type: number;

  @Column()
  course_id: number;

  @Column()
  status: number;

  @Column()
  start_date: Date;
  startDateParseDate: string;

  @Column()
  end_date: Date;
  endDateParseDate: string;

  @OneToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course?: Course;

  @OneToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  provider?: Provider;

  @AfterLoad()
  setEntityName() {
    this.startDateParseDate = moment(this.start_date).format(
      'yyyy-MM-D HH:mm:ss',
    );
    this.endDateParseDate = moment(this.end_date).format('yyyy-MM-D HH:mm:ss');
  }
}
