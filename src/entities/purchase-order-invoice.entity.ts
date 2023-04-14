import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'purchase_order_invoices' })
export class PurchaseOrderInvoice extends EntityHelper {
  @Column()
  user_id?: number;

  @Column()
  invoice_number?: string;

  @Column()
  invoice_date?: Date;

  @Column()
  invoice_status?: string;

  @Column()
  payment_date?: Date;

  @Column()
  supplier_tax_number?: string;

  @Column()
  supplier_tax_date?: Date;

  @Column()
  purchase_order_id?: string;

  @Column()
  payment_amount?: number;

  @Column()
  deduction_amount?: number;

  @ManyToOne(() => PurchaseOrder, {})
  @JoinColumn({ name: 'purchase_order_id' })
  po?: PurchaseOrder;
}
