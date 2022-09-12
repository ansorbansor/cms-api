import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';
import { CourseLanguage } from './course-language.entity';

@Entity({ name: 'course_language_transactions' })
export class CourseLanguageTransaction extends EntityHelper {
  @Column()
  course_id: number;

  @Column()
  language_id: number;

  @ManyToOne(() => Course)
  @JoinColumn({ name: 'course_id' })
  course?: Course;
  course_count: number;

  @ManyToOne(() => CourseLanguage)
  @JoinColumn({ name: 'language_id' })
  language?: CourseLanguage;
}
