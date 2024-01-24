import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'customers' })
export class Customer extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;

  @OneToMany(() => PurchaseOrder, (po) => po.customer)
  @JoinColumn()
  customerPO?: PurchaseOrder[];
}
