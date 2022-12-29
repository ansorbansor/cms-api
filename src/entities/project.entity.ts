import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'projects' })
export class Project extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  code?: string;
}
