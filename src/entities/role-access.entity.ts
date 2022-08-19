import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';
import { Menu } from './menu.entity';

@Entity({ name: 'role_access' })
export class RoleAccess extends EntityHelper {
  @Column()
  role_id?: number;

  @Column()
  menu_id?: number;

  @ApiProperty({ description: '0:create,1:read,2:update,3:delete' })
  @Column()
  menu_access?: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menu_id' })
  menu?: Menu;
}
