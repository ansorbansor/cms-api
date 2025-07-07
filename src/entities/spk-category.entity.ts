import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_category' })
export class SPKCategory extends EntityHelper {
  @Column()
  name?: string;
}
