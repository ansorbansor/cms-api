import { Column, Entity, Index } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'employee_positions' })
export class EmployeePosition extends EntityHelper {
  @Index()
  @Column()
  name: string | null;
}
