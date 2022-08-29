import { Column, Entity, JoinColumn } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';

@Entity({ name: 'course_durations' })
export class CourseDuration extends EntityHelper {
  @Column()
  name: string;

  @Column()
  minimum: number;

  @Column()
  maximum: number;

  @JoinColumn()
  course: Course;
}
