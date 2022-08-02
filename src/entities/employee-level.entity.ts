import { Column, Entity, Index } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'employee_levels' })
export class EmployeeLevel extends EntityHelper {
  @Index()
  @Column()
  name: string | null;
}
