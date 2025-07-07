import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Menu } from './menu.entity';
import { EmployeePosition } from './employee-position.entity';

@Entity({ name: 'role_access' })
export class RoleAccess extends EntityHelper {
  @Column()
  employee_position_id?: number;

  @Column()
  menu_id?: number;

  @ApiProperty({ description: '0:create,1:read,2:update,3:delete' })
  @Column()
  menu_access?: number;

  @ManyToOne(() => EmployeePosition)
  @JoinColumn({ name: 'employee_position_id' })
  employeePosition?: EmployeePosition;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menu_id' })
  menu?: Menu;
}
