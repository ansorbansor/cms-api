import { Column, Entity, Index, JoinColumn, OneToMany } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { RoleAccess } from './role-access.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow } from 'class-validator';

@Entity({ name: 'employee_positions' })
export class EmployeePosition extends EntityHelper {
  @Index()
  @Column({ nullable: true })
  name: string | null;

  @OneToMany(() => RoleAccess, (roleAccess) => roleAccess.employeePosition)
  @JoinColumn()
  roleAccess?: RoleAccess[];

  @ApiProperty({ example: 'Admin' })
  @Column({ nullable: true })
  code?: string;

  @Allow()
  @Column({ nullable: true })
  @Transform(({ value }) => value === 1)
  grant_all_access?: boolean;
}
