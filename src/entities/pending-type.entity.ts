import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'pending_types' })
export class PendingType extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
