import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { RoleAccess } from './role-access.entity';
import { UserRoles } from './user-role.entity';

@Entity({ name: 'roles' })
export class Role extends EntityHelper {
  @Allow()
  @ApiProperty({ example: 'Admin' })
  @Column()
  name?: string;

  @OneToMany(() => RoleAccess, (roleAccess) => roleAccess.role)
  @JoinColumn()
  roleAccess?: RoleAccess[];

  @OneToMany(() => UserRoles, (userRole) => userRole.role)
  @JoinColumn()
  userRole?: UserRoles[];
  userCount: number;

  @AfterLoad()
  countUserComment() {
    this.userCount = 0;
    if (this.userRole) {
      this.userCount = this.userRole.length;
    }
  }
}
