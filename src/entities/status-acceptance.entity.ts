import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'sites' })
export class Site extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
