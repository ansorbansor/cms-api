import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'bidding_areas' })
export class BiddingArea extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
