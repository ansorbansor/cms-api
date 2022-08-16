import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'providers' })
export class Provider extends EntityHelper {
  @Column()
  name: string | null;

  @Column()
  fetch_data: boolean | null;

  @Column()
  photo: number | null;

  @Column()
  last_update: Date | null;

  @Column()
  url: string;
}
