import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'topics' })
export class Topic extends EntityHelper {
  @Column()
  name: string;

  @Column()
  category_id: number;
}
