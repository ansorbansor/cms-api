import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'provider_categories' })
export class ProviderCategory extends EntityHelper {
  @ApiProperty()
  @Column()
  provider_id?: number;

  @ApiProperty()
  @Column()
  external_id?: string;

  @ApiProperty()
  @Column()
  name?: string;
}
