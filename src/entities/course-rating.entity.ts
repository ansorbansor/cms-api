import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'course_ratings' })
export class CourseRating extends EntityHelper {
  @Column()
  name: string;
}
