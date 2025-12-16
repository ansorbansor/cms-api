import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { EntityHelper } from 'src/utils/entity-helper';
import { User } from './user.entity';
import { Region } from './region.entity';
import { Project } from './project.entity';
import { Area } from './area.entity';
import { Operator } from './operator.entity';
import { Customer } from './customer.entity';
import { Site } from './site.entity';
import { BiddingArea } from './bidding_area.entity';
import { RemarkProject } from './remark-project.entity';
import { StatusAcceptance } from './status-acceptance.entity';
import { PendingType } from './pending-type.entity';
import { PD } from './pd.entity';
import { PurchaseOrderInvoice } from './purchase-order-invoice.entity';

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
  project_id: number;

  @Column()
  site_id: number;

  @Column()
  status: string;

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
  publish_date?: Date;

  @Column()
  start_date?: Date;

  @Column()
  end_date?: Date;

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
  actual_completion_date?: Date;

  @Column()
  ready_invoice: string;

  @Column()
  amount_ready_invoice: number;

  @Column()
  remark_highlight: string;

  @Column()
  budget_percentage: number;

  @Column()
  total_acceptance: number;

  @Column()
  ny_invoice: number;

  @Column()
  ny_invoice_date?: Date;

  @Column()
  piutang: number;

  @Column()
  priority_site_list: string;

  @Column()
  amount_priority: number;

  @Column()
  achievement_priority: number;

  @Column()
  actual_work_date?: Date;

  @Column()
  actual_work_amount: number;

  @Column()
  actual_work_status: string;

  @Column()
  remark_highlight_recon: string;

  @Column()
  pic: number;

  @Column()
  plan_date: Date;

  @Column()
  start_progress?: Date;

  @Column()
  finish_progress?: Date;

  @Column()
  done_atp?: Date;

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @OneToOne(() => Region)
  @JoinColumn({ name: 'region_id' })
  region: Region;

  @OneToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area: Area;

  @OneToOne(() => Operator)
  @JoinColumn({ name: 'operator_id' })
  operator: Operator;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToOne(() => Site)
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @OneToOne(() => BiddingArea)
  @JoinColumn({ name: 'bidding_area_id' })
  bidding_area: BiddingArea;

  @OneToOne(() => RemarkProject)
  @JoinColumn({ name: 'remark_project_id' })
  remark_project: RemarkProject;

  @OneToOne(() => StatusAcceptance)
  @JoinColumn({ name: 'status_acceptance_id' })
  status_acceptance: StatusAcceptance;

  @OneToOne(() => PendingType)
  @JoinColumn({ name: 'pending_type_id' })
  pending_type: PendingType;

  @OneToOne(() => PD)
  @JoinColumn({ name: 'pd_id' })
  pd: PD;

  @OneToMany(() => PurchaseOrderInvoice, (po_invoice) => po_invoice.po)
  @JoinColumn()
  po_invoice?: PurchaseOrderInvoice[];

  @ManyToOne(() => User, {
    eager: true,
  })
  @JoinColumn({ name: 'pic' })
  pic_data?: User;

  @Column({ select: false, insert: false, readonly: true })
  total_cash_advance: number;
}
