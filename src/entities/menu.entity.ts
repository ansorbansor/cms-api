import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'menus' })
export class Menu extends EntityHelper {
  @ApiProperty({ example: 'Home' })
  @Column()
  name?: string;
}
