import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';

@Entity({ name: 'user_likes' })
export class UserLike extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  course_id: number;

  @OneToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course: Course;
}
