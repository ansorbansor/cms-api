import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Course } from './course.entity';

@Entity({ name: 'course_levels' })
export class CourseLevel extends EntityHelper {
  @Column()
  name: string;

  @OneToMany(() => Course, (course) => course.courseLevel)
  @JoinColumn()
  course?: Course[];
  course_count: number;

  @AfterLoad()
  setCount() {
    this.course_count = this.course
      ? this.course.filter((e) => e.status == 1).length
      : 0;
  }
}
