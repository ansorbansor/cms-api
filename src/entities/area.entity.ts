import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'areas' })
export class Area extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;

  @OneToMany(() => PurchaseOrder, (po) => po.area)
  @JoinColumn()
  po?: PurchaseOrder[];
}
