import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'status_acceptances' })
export class StatusAcceptance extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
