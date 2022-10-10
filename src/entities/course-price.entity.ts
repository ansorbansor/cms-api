import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';

@Entity({ name: 'course_prices' })
export class CoursePrice extends EntityHelper {
  @Column()
  name: string;

  @OneToMany(() => Course, (course) => course.coursePrice)
  @JoinColumn()
  course?: Course[];
  course_count: number;

  @AfterLoad()
  setCount() {
    this.course_count = this.course ? this.course.length : 0;
  }
}
