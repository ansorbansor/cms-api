import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { PurchaseOrder } from './purchase-order.entity';

@Entity({ name: 'purchase_order_invoices' })
export class PurchaseOrderInvoice extends EntityHelper {
  @Column({ nullable: true })
  user_id?: number;

  @Column({ nullable: true })
  invoice_number?: string;

  @Column({ nullable: true })
  invoice_date?: Date;

  @Column({ nullable: true })
  invoice_status?: string;

  @Column({ nullable: true })
  payment_date?: Date;

  @Column({ nullable: true })
  supplier_tax_number?: string;

  @Column({ nullable: true })
  supplier_tax_date?: Date;

  @Column({ nullable: true })
  purchase_order_id?: string;

  @Column({ type: 'float', nullable: true })
  payment_amount?: number;

  @Column({ type: 'float', nullable: true })
  deduction_amount?: number;

  @Column({ type: 'float', nullable: true })
  unit_price?: number;

  @Column({ nullable: true })
  submit_date?: Date;

  @Column({ type: 'float', nullable: true })
  submit_amount?: number;

  @Column({ nullable: true })
  approve_date?: Date;

  @Column({ type: 'float', nullable: true })
  approve_amount?: number;

  @Column({ nullable: true })
  position?: number;

  @ManyToOne(() => PurchaseOrder, {})
  @JoinColumn({ name: 'purchase_order_id' })
  po?: PurchaseOrder;
}
