import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'categories' })
export class CourseCategory extends EntityHelper {
  @Column()
  name: string;

  @Column()
  photo: number;
}
