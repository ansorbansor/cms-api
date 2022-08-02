import { Column, Entity, Index } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'employee_units' })
export class EmployeeUnit extends EntityHelper {
  @Index()
  @Column()
  name: string | null;
}
