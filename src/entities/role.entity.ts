import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { RoleAccess } from './role-access.entity';

@Entity({ name: 'roles' })
export class Role extends EntityHelper {
  @Allow()
  @ApiProperty({ example: 'Admin' })
  @Column()
  name?: string;

  @OneToMany(() => RoleAccess, (roleAccess) => roleAccess.role)
  @JoinColumn()
  roleAccess?: RoleAccess[];
}
