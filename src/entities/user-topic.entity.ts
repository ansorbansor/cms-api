import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'user_topics' })
export class UserTopic extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  category_id: number;

  @Column()
  topic_id: number;
}
