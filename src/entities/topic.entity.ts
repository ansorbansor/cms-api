import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
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

  @OneToMany(() => Course, (course) => course.topic)
  @JoinColumn()
  course?: Course[];
}
