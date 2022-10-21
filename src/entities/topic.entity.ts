import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { CourseCategory } from './course-category.entity';
import { Course } from './course.entity';

@Entity({ name: 'topics' })
export class Topic extends EntityHelper {
  @Column()
  name: string;

  @Column()
  category_id: number;

  @ManyToOne(() => CourseCategory)
  @JoinColumn({ name: 'category_id' })
  category?: CourseCategory;
  course_count: number;

  @OneToMany(() => Course, (course) => course.topic)
  @JoinColumn()
  course?: Course[];

  @AfterLoad()
  setCount() {
    this.course_count = this.course
      ? this.course.filter((e) => e.status == 1).length
      : 0;
  }
}
