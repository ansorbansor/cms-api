import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity({ name: 'user_courses' })
export class UserCourse extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  course_id: number;

  @Column()
  progress: number;

  @Column()
  certificate_date: Date;

  @Column()
  certificate_number: string;

  @Column()
  certificate_image: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course?: Course;
}
