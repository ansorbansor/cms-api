import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import appConfig from 'src/config/app.config';
import { User } from './user.entity';

@Entity({ name: 'categories' })
export class Category extends EntityHelper {
  @Column()
  name: string;

  @Column()
  photo: number;
}
