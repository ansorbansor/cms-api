import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { Topic } from './topic.entity';

@Entity({ name: 'categories' })
export class CourseCategory extends EntityHelper {
  @Column()
  name: string;

  @Column()
  photo: number;

  @OneToMany(() => Topic, (topics) => topics.category)
  @JoinColumn()
  topic?: Topic[];
}
