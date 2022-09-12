import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { CourseLanguageTransaction } from './course-language-transaction.entity';

@Entity({ name: 'course_languages' })
export class CourseLanguage extends EntityHelper {
  @Column()
  name: string;

  @OneToMany(() => CourseLanguageTransaction, (course) => course.course_id)
  @JoinColumn()
  course?: CourseLanguageTransaction[];
  course_count: number;

  @AfterLoad()
  setCount() {
    this.course_count = this.course ? this.course.length : 0;
  }
}
