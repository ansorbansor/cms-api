import { Column, Entity } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'job_categories' })
export class JobCategory extends EntityHelper {
  @Column({ nullable: false })
  name: string;
}
