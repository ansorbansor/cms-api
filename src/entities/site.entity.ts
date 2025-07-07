import { Column, Entity, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EntityHelper } from 'src/utils/entity-helper';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'sites' })
export class Site extends EntityHelper {
  @ApiProperty({ example: 'Test' })
  @Column()
  name?: string;

  @ApiProperty({ example: 'Test' })
  @Column()
  code?: string;

  @OneToMany(() => PurchaseOrder, (po) => po.site)
  @JoinColumn()
  sitePO?: PurchaseOrder[];
}
