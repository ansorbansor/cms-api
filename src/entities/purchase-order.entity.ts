import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';

@Entity({ name: 'purchase_orders' })
export class PurchaseOrder extends EntityHelper {
  @Column()
  user_id: number;

  @Column()
  cc: string;

  @Column()
  line_po_status: number;

  @Column()
  line_po_number: string;

  @Column()
  po_number: string;

  @Column()
  shipment_number: string;

  @Column()
  region_id: number;

  @Column()
  area_id: number;

  @Column()
  operator_id: number;

  @Column()
  customer_id: number;

  @Column()
  project_name: string;

  @Column()
  project_code: string;

  @Column()
  site_id: number;

  @Column()
  status: number;

  @Column()
  item_code: string;

  @Column()
  item_description: string;

  @Column()
  unit_price: number;

  @Column()
  unit_price_1: number;

  @Column()
  unit_price_2: number;

  @Column()
  requested_qty: number;

  @Column()
  billed_qty: number;

  @Column()
  due_qty: number;

  @Column()
  line_amount: number;

  @Column()
  remaining_from_po: number;

  @Column()
  unit: string;

  @Column()
  payment_terms: string;

  @Column()
  bidding_area_id: number;

  @Column()
  publish_date: Date;

  @Column()
  start_date: Date;

  @Column()
  end_date: Date;

  @Column()
  priority_esar_approve: string;

  @Column()
  remark_weekly: string;

  @Column()
  remark_project_id: number;

  @Column()
  status_acceptance_id: number;

  @Column()
  pending_type_id: number;

  @Column()
  pending_approval_pd: string;

  @Column()
  amount_pending_approval_pd: number;

  @Column()
  pd_id: number;

  @Column()
  actual_completion_date: Date;

  @Column()
  ready_invoice: string;

  @Column()
  amount_ready_invoice: number;

  @Column()
  remark_highlight: string;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;
}
