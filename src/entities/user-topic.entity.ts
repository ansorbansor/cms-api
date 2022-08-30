import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { CourseCategory } from './course-category.entity';
import { Topic } from './topic.entity';

@Entity({ name: 'user_topics' })
export class UserTopic extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  category_id: number;

  @Column()
  topic_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @OneToOne(() => CourseCategory)
  @JoinColumn({ name: 'category_id' })
  category?: CourseCategory | null;

  @OneToOne(() => Topic)
  @JoinColumn({ name: 'topic_id' })
  topic?: Topic | null;
}
