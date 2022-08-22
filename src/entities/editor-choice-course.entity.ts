import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';

@Entity({ name: 'editor_choice_courses' })
export class EditorChoiceCourse extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  course_id: number;

  @Column()
  position: number;

  @ManyToOne(() => Course, {
    eager: true,
  })
  @JoinColumn({ name: 'course_id' })
  course?: Course;
}
