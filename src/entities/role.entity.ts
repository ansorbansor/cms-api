import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'roles' })
export class Role extends EntityHelper {
  @Allow()
  @ApiProperty({ example: 'Admin' })
  @Column()
  name?: string;
}
