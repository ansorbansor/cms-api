import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_subcategory' })
export class SPKSubCategory extends EntityHelper {
  @Column()
  name?: string;
}
