import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_operational_request_types' })
export class SPKOperationalRequestType extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
