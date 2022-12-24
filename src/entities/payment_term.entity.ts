import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';

@Entity({ name: 'payment_terms' })
export class PaymentTerm extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;
}
