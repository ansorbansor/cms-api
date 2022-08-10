import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_prices' })
export class CoursePrice extends EntityHelper {
  @Column()
  name: string;
}
