import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'remark_projects' })
export class RemarkProject extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
