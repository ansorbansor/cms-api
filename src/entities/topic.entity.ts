import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { CourseCategory } from './course-category.entity';

@Entity({ name: 'topics' })
export class Topic extends EntityHelper {
  @Column()
  name: string;

  @Column()
  category_id: number;

  @ManyToOne(() => CourseCategory)
  @JoinColumn({ name: 'category_id' })
  category?: CourseCategory;
}
