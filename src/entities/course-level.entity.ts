import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_levels' })
export class CourseLevel extends EntityHelper {
  @Column()
  name: string;
}
