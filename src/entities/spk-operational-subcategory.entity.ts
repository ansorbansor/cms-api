import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'spk_operational_subcategories' })
export class SPKOperationalSubCategory extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
