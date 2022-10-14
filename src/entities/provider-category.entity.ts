import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { Provider } from './provider.entity';

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

  @OneToOne(() => Provider)
  @JoinColumn({ name: 'provider_id' })
  providerData: Provider;
}
