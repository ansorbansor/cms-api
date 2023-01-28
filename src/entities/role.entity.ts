import { AfterLoad, Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';
import { RoleAccess } from './role-access.entity';
import { UserRoles } from './user-role.entity';
import { Transform } from 'class-transformer';

@Entity({ name: 'roles' })
export class Role extends EntityHelper {
  @Allow()
  @ApiProperty({ example: 'Admin' })
  @Column()
  name?: string;

  @ApiProperty({ example: 'Admin' })
  @Column()
  code?: string;

  @Allow()
  @Column()
  @Transform(({ value }) => value === 1)
  grant_all_access?: boolean;

  @OneToMany(() => RoleAccess, (roleAccess) => roleAccess.role)
  @JoinColumn()
  roleAccess?: RoleAccess[];

  @OneToMany(() => UserRoles, (userRole) => userRole.roleData)
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
