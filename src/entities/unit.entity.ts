import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'units' })
export class Unit extends EntityHelper {
  @Column()
  name?: string;
}
